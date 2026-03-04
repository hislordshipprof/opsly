import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveEscalations, acknowledgeEscalation } from '@/services/api';
import { useDashboardStore } from '@/stores/dashboardStore';
import { SlaCountdown } from './SlaCountdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface EscalationItem {
  id: string;
  attemptNumber: number;
  eventType: string;
  reason: string;
  createdAt: string;
  contact: { label: string; position: number };
  workOrder: {
    id: string;
    orderNumber: string;
    priority: string;
    slaDeadline: string;
    slaBreached: boolean;
    issueDescription: string;
    property: { name: string };
    unit: { unitNumber: string };
    assignedTo: { name: string } | null;
  };
}

export function EscalationFeed() {
  const { selectWorkOrder } = useDashboardStore();
  const queryClient = useQueryClient();
  const [ackingId, setAckingId] = useState<string | null>(null);

  const { data: escalations, isLoading } = useQuery<EscalationItem[]>({
    queryKey: ['escalations'],
    queryFn: getActiveEscalations,
    refetchInterval: false,
  });

  const ackMutation = useMutation({
    mutationFn: (id: string) => acknowledgeEscalation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      setAckingId(null);
    },
  });

  const levelLabel = (position: number) =>
    position === 1 ? 'L1' : position === 2 ? 'L2' : `L${position}`;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Escalations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            SLA breaches & active alerts
          </p>
        </div>
        {escalations && escalations.length > 0 && (
          <span className="size-5 rounded-full bg-opsly-urgent/15 text-opsly-urgent text-[10px] font-bold flex items-center justify-center">
            {escalations.length}
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

          {escalations?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No escalations right now.
            </p>
          )}

          {escalations?.map((esc) => (
            <div
              key={esc.id}
              className="bg-opsly-urgent/5 border border-opsly-urgent/15 rounded-xl p-3 cursor-pointer transition-colors hover:bg-opsly-urgent/10"
              onClick={() => selectWorkOrder(esc.workOrder.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-sm font-semibold text-opsly-urgent">
                    {esc.workOrder.orderNumber}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-opsly-urgent/15 text-opsly-urgent">
                    {levelLabel(esc.contact.position)} &middot; {esc.contact.label}
                  </span>
                </div>
                <SlaCountdown
                  slaDeadline={esc.workOrder.slaDeadline}
                  slaBreached={esc.workOrder.slaBreached}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                {esc.workOrder.property.name} / {esc.workOrder.unit.unitNumber} &mdash;{' '}
                {esc.workOrder.issueDescription}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">
                  {esc.workOrder.assignedTo
                    ? `Assigned: ${esc.workOrder.assignedTo.name}`
                    : 'Unassigned'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] rounded-full border-opsly-urgent/30 text-opsly-urgent hover:bg-opsly-urgent/10"
                  disabled={ackMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAckingId(esc.id);
                    ackMutation.mutate(esc.id);
                  }}
                >
                  {ackMutation.isPending && ackingId === esc.id ? 'Ack...' : 'Acknowledge'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
