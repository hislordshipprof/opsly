import { useQuery } from '@tanstack/react-query';
import { getWorkOrders } from '@/services/api';
import { useDashboardStore } from '@/stores/dashboardStore';
import { PriorityBadge } from './PriorityBadge';
import { SlaCountdown } from './SlaCountdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { WorkOrderListItem } from '@/types';

/**
 * Escalation feed — shows SLA-breached and at-risk work orders.
 * Full escalation ladder (M9) will replace the data source,
 * but the UI pattern stays the same.
 */
export function EscalationFeed() {
  const { selectWorkOrder, openAssignModal } = useDashboardStore();

  // Fetch orders that are escalated or SLA-breached
  const { data: escalated, isLoading } = useQuery<WorkOrderListItem[]>({
    queryKey: ['work-orders', 'escalations-feed'],
    queryFn: async () => {
      const all: WorkOrderListItem[] = await getWorkOrders({ take: 50 });
      return all.filter(
        (wo) => wo.slaBreached || wo.status === 'ESCALATED',
      );
    },
    refetchInterval: false,
  });

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Escalations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            SLA breaches & at-risk orders
          </p>
        </div>
        {escalated && escalated.length > 0 && (
          <span className="size-5 rounded-full bg-opsly-urgent/15 text-opsly-urgent text-[10px] font-bold flex items-center justify-center">
            {escalated.length}
          </span>
        )}
      </div>

      <ScrollArea className="max-h-[320px]">
        <div className="px-5 pb-4 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {escalated?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No escalations right now.
            </p>
          )}

          {escalated?.map((wo) => (
            <div
              key={wo.id}
              className="bg-opsly-urgent/5 border border-opsly-urgent/15 rounded-xl p-3 cursor-pointer transition-colors hover:bg-opsly-urgent/10"
              onClick={() => selectWorkOrder(wo.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-sm font-semibold text-opsly-urgent">
                    {wo.orderNumber}
                  </span>
                  <PriorityBadge priority={wo.priority} />
                </div>
                <SlaCountdown slaDeadline={wo.slaDeadline} slaBreached={wo.slaBreached} />
              </div>

              <p className="text-xs text-muted-foreground mt-1 truncate">
                {wo.property.name} / {wo.unit.unitNumber} — {wo.issueDescription}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {wo.assignedTo
                    ? `Assigned: ${wo.assignedTo.name}`
                    : 'Unassigned'}
                </span>
                {!wo.assignedTo && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] rounded-full border-opsly-urgent/30 text-opsly-urgent hover:bg-opsly-urgent/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAssignModal(wo.id);
                    }}
                  >
                    Assign Now
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
