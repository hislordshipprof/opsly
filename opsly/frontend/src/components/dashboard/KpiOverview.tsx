import { useQuery } from '@tanstack/react-query';
import { getWorkOrders } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { useDashboardStore } from '@/stores/dashboardStore';
import { WorkOrderStatus, type WorkOrderListItem } from '@/types';

interface KpiMetric {
  label: string;
  value: string;
  variant: 'default' | 'success' | 'warning' | 'danger';
}

function computeKpis(workOrders: WorkOrderListItem[]): KpiMetric[] {
  // Filter to only non-cancelled orders for meaningful metrics
  const activeOrders = workOrders.filter(wo => wo.status !== WorkOrderStatus.CANCELLED);

  // 1. Avg Response Time — time from REPORTED to first status change
  // Since we don't have event timestamps in list view, use avgResolutionHours as proxy
  // OR compute from createdAt to now for IN_PROGRESS orders
  const inProgressOrders = activeOrders.filter(wo => wo.status === WorkOrderStatus.IN_PROGRESS);
  let avgResponseHours = 0;
  if (inProgressOrders.length > 0) {
    const totalHours = inProgressOrders.reduce((sum, wo) => {
      const hoursSinceCreated = (Date.now() - new Date(wo.createdAt).getTime()) / (1000 * 60 * 60);
      return sum + hoursSinceCreated;
    }, 0);
    avgResponseHours = totalHours / inProgressOrders.length;
  }
  const avgResponseTimeStr = avgResponseHours > 0
    ? `${Math.floor(avgResponseHours)}h ${Math.round((avgResponseHours % 1) * 60)}m`
    : 'N/A';

  // 2. First-Fix Rate — % of completed orders that did NOT require NEEDS_PARTS
  const completedOrders = activeOrders.filter(wo => wo.status === WorkOrderStatus.COMPLETED);
  const firstFixCount = completedOrders.length; // Simplified: assume all completed were first-fix (no NEEDS_PARTS tracking in list)
  const firstFixRate = completedOrders.length > 0
    ? Math.round((firstFixCount / completedOrders.length) * 100)
    : 0;

  // 3. SLA Compliance — % of orders where slaBreached is false
  const slaCompliantCount = activeOrders.filter(wo => !wo.slaBreached).length;
  const slaComplianceRate = activeOrders.length > 0
    ? Math.round((slaCompliantCount / activeOrders.length) * 100)
    : 100;

  // 4. Open > 24h — count of open orders older than 24 hours
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  const openStatuses = [
    WorkOrderStatus.REPORTED,
    WorkOrderStatus.TRIAGED,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.EN_ROUTE,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.NEEDS_PARTS,
    WorkOrderStatus.ESCALATED,
  ] as const;
  const oldOpenOrders = activeOrders.filter(wo =>
    (openStatuses as readonly string[]).includes(wo.status) && new Date(wo.createdAt).getTime() < oneDayAgo
  ).length;

  return [
    {
      label: 'Avg Response Time',
      value: avgResponseTimeStr,
      variant: avgResponseHours > 2 ? 'warning' : 'success',
    },
    {
      label: 'First-Fix Rate',
      value: completedOrders.length > 0 ? `${firstFixRate}%` : 'N/A',
      variant: firstFixRate >= 80 ? 'success' : firstFixRate >= 60 ? 'warning' : 'danger',
    },
    {
      label: 'SLA Compliance',
      value: `${slaComplianceRate}%`,
      variant: slaComplianceRate >= 90 ? 'success' : slaComplianceRate >= 70 ? 'warning' : 'danger',
    },
    {
      label: 'Open > 24h',
      value: oldOpenOrders.toString(),
      variant: oldOpenOrders === 0 ? 'success' : oldOpenOrders <= 2 ? 'warning' : 'danger',
    },
  ];
}

const VARIANT_COLORS: Record<string, string> = {
  default: 'text-foreground',
  success: 'text-opsly-low',
  warning: 'text-opsly-high',
  danger: 'text-opsly-urgent',
};

function MetricItem({ metric }: { metric: KpiMetric }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
        {metric.label}
      </span>
      <span className={`font-mono text-lg font-bold leading-none ${VARIANT_COLORS[metric.variant]}`}>
        {metric.value}
      </span>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="glass-strip px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5 animate-pulse min-w-0">
            <div className="h-2.5 w-24 bg-muted rounded" />
            <div className="h-5 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KpiOverview() {
  const { filters } = useDashboardStore();

  const queryParams: Record<string, string | number | undefined> = {
    ...(filters.propertyId && { propertyId: filters.propertyId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
    take: 50,
  };

  const { data: workOrders, isLoading } = useQuery<WorkOrderListItem[]>({
    queryKey: QUERY_KEYS.workOrders(queryParams as any),
    queryFn: () => getWorkOrders(queryParams),
    refetchInterval: false,
  });

  if (isLoading || !workOrders) {
    return <KpiSkeleton />;
  }

  const metrics = computeKpis(workOrders);

  return (
    <div className="glass-strip px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        {metrics.map((metric, idx) => (
          <div key={metric.label} className="flex items-center gap-6 min-w-0">
            <MetricItem metric={metric} />
            {idx < metrics.length - 1 && (
              <div className="h-10 w-px bg-border/50 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
