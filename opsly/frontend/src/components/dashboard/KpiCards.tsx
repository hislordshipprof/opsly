import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import type { DashboardMetrics } from '@/types';

interface KpiCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  variant?: 'default' | 'urgent' | 'active' | 'success';
}

const VARIANT_CONFIG: Record<string, { card: string; value: string; accent: string }> = {
  default: {
    card: 'glass-card',
    value: 'text-foreground',
    accent: 'bg-primary',
  },
  urgent: {
    card: 'glass-card',
    value: 'text-opsly-urgent',
    accent: 'bg-opsly-urgent',
  },
  active: {
    card: 'glass-card',
    value: 'text-primary',
    accent: 'bg-primary',
  },
  success: {
    card: 'glass-card',
    value: 'text-opsly-low',
    accent: 'bg-opsly-low',
  },
};

function KpiCard({ label, value, subtitle, variant = 'default' }: KpiCardProps) {
  const config = VARIANT_CONFIG[variant];
  return (
    <div className={`${config.card} relative overflow-hidden p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group`}>
      {/* Accent strip at top */}
      <div className={`absolute top-0 left-6 right-6 h-[2px] ${config.accent} rounded-full opacity-60 group-hover:opacity-100 transition-opacity`} />
      <p className="text-[13px] font-medium text-muted-foreground tracking-wide">{label}</p>
      <p className={`font-mono text-4xl font-extrabold mt-1.5 tracking-tight ${config.value}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-9 w-16 bg-muted rounded mt-3" />
      <div className="h-3 w-32 bg-muted rounded mt-2" />
    </div>
  );
}

export function KpiCards() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: QUERY_KEYS.metrics(),
    queryFn: getDashboardMetrics,
    refetchInterval: false,
  });

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        label="Open Orders"
        value={metrics.openOrders}
        subtitle={`${metrics.unassigned} unassigned`}
      />
      <KpiCard
        label="Urgent / SLA Risk"
        value={metrics.urgentOrders + metrics.slaAtRisk}
        subtitle={`${metrics.urgentOrders} urgent, ${metrics.slaAtRisk} at risk`}
        variant="urgent"
      />
      <KpiCard
        label="In Progress"
        value={metrics.inProgressOrders}
        subtitle={metrics.avgResolutionHours != null
          ? `Avg resolution: ${metrics.avgResolutionHours}h`
          : 'No resolution data yet'}
        variant="active"
      />
      <KpiCard
        label="Completed Today"
        value={metrics.completedToday}
        variant="success"
      />
    </div>
  );
}
