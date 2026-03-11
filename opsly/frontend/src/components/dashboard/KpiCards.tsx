import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import type { DashboardMetrics } from '@/types';

interface KpiCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  variant?: 'default' | 'urgent' | 'active' | 'success';
  icon: React.ReactNode;
}

const VARIANT_CONFIG: Record<string, {
  glow: string;
  value: string;
  strip: string;
  iconBg: string;
  iconText: string;
}> = {
  default: {
    glow: 'glow-card--default',
    value: 'text-foreground',
    strip: 'bg-primary/80',
    iconBg: 'bg-blue-100/50 ring-blue-500/10',
    iconText: 'text-blue-700',
  },
  urgent: {
    glow: 'glow-card--urgent',
    value: 'text-opsly-urgent',
    strip: 'bg-opsly-urgent/80',
    iconBg: 'bg-rose-100/50 ring-rose-500/10',
    iconText: 'text-rose-700',
  },
  active: {
    glow: 'glow-card--active',
    value: 'text-primary',
    strip: 'bg-indigo-500/80',
    iconBg: 'bg-indigo-100/50 ring-indigo-500/10',
    iconText: 'text-indigo-700',
  },
  success: {
    glow: 'glow-card--success',
    value: 'text-opsly-low',
    strip: 'bg-opsly-low/80',
    iconBg: 'bg-emerald-100/50 ring-emerald-500/10',
    iconText: 'text-emerald-700',
  },
};

/* Inline SVG icons — no external dependency needed */
function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function KpiCard({ label, value, subtitle, variant = 'default', icon }: KpiCardProps) {
  const config = VARIANT_CONFIG[variant];
  return (
    <div className="glass-card overflow-hidden transition-all duration-200 hover:scale-[1.01] group">
      {/* Colored top strip */}
      <div className={`h-1 w-full ${config.strip}`} />
      <div className="p-5 relative">
        {/* Top row: label + icon bubble */}
        <div className="flex items-start justify-between">
          <p className="text-[13px] font-bold text-foreground/90 tracking-wide">{label}</p>
          <div className={`rounded-full p-2.5 shadow-sm ring-1 ${config.iconBg}`}>
            <span className={config.iconText}>{icon}</span>
          </div>
        </div>
        {/* Big number */}
        <p className={`text-3xl font-bold mt-2 tracking-tight ${config.value}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs font-semibold text-foreground/70 mt-1.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="h-1 w-full bg-muted" />
      <div className="p-5">
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="size-10 bg-muted rounded-full" />
        </div>
        <div className="h-8 w-16 bg-muted rounded mt-3" />
        <div className="h-3 w-32 bg-muted rounded mt-2" />
      </div>
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
        icon={<InboxIcon />}
      />
      <KpiCard
        label="Urgent / SLA Risk"
        value={metrics.urgentOrders + metrics.slaAtRisk}
        subtitle={`${metrics.urgentOrders} urgent, ${metrics.slaAtRisk} at risk`}
        variant="urgent"
        icon={<AlertCircleIcon />}
      />
      <KpiCard
        label="In Progress"
        value={metrics.inProgressOrders}
        subtitle={metrics.avgResolutionHours != null
          ? `Avg resolution: ${metrics.avgResolutionHours}h`
          : 'No resolution data yet'}
        variant="active"
        icon={<ClockIcon />}
      />
      <KpiCard
        label="Completed Today"
        value={metrics.completedToday}
        variant="success"
        icon={<CheckCircleIcon />}
      />
    </div>
  );
}
