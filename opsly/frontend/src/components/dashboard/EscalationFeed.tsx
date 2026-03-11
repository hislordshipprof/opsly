import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveEscalations, acknowledgeEscalation } from '@/services/api';
import { useDashboardStore } from '@/stores/dashboardStore';
import { SlaCountdown } from './SlaCountdown';
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
    unit: { unitNumber: string; property: { name: string; address: string } };
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
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-opsly-urgent/10 dark:bg-opsly-urgent/15 flex items-center justify-center">
            <svg className="size-4 text-opsly-urgent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold">Escalations</h3>
            <p className="text-[11px] font-semibold text-foreground/70">Active alerts</p>
          </div>
        </div>
        {escalations && escalations.length > 0 && (
          <span className="min-w-[22px] h-[22px] rounded-full bg-opsly-urgent text-white text-[10px] font-bold flex items-center justify-center px-1.5">
            {escalations.length}
          </span>
        )}
      </div>

      <div className="max-h-[480px] overflow-y-auto scrollbar-none px-5 pb-5 space-y-2.5">
          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {escalations?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full p-3 shadow-sm ring-1 bg-white/60 dark:bg-card/40 ring-black/5 dark:ring-white/10">
                <svg className="size-6 text-opsly-low" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium">No escalations right now</p>
              <p className="text-xs text-foreground/60 font-medium">You're all caught up!</p>
            </div>
          )}

          {/* Escalation cards */}
          {escalations?.map((esc) => (
            <div
              key={esc.id}
              className="relative rounded-xl border border-border/60 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] overflow-hidden cursor-pointer transition-all duration-200 hover:bg-white/70 dark:hover:bg-white/[0.06] hover:shadow-sm group"
              onClick={() => selectWorkOrder(esc.workOrder.id)}
            >
              {/* Left urgency stripe */}
              <div className="absolute left-0 inset-y-0 w-1 bg-opsly-urgent rounded-l-xl" />

              <div className="pl-4 pr-3.5 py-3">
                {/* Row 1: Order number + level badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-foreground shrink-0">
                    {esc.workOrder.orderNumber}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-opsly-urgent/15 dark:bg-opsly-urgent/20 text-opsly-urgent ring-1 ring-inset ring-opsly-urgent/30 whitespace-nowrap">
                    {levelLabel(esc.contact.position)} · {esc.contact.label}
                  </span>
                  <div className="ml-auto shrink-0">
                    <SlaCountdown
                      slaDeadline={esc.workOrder.slaDeadline}
                      slaBreached={esc.workOrder.slaBreached}
                    />
                  </div>
                </div>

                {/* Row 2: Location + Description */}
                <p className="text-[11px] font-semibold text-foreground/80 mt-1.5">
                  {esc.workOrder.unit.property.name} / Unit {esc.workOrder.unit.unitNumber}
                </p>
                <p className="text-xs text-foreground/70 font-medium mt-0.5 line-clamp-2 leading-relaxed">
                  {esc.workOrder.issueDescription}
                </p>

                {/* Row 4: Assigned + Acknowledge */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/40 dark:border-white/[0.04]">
                  <span className="text-[11px] text-foreground/70 font-semibold">
                    {esc.workOrder.assignedTo
                      ? <>Assigned to <span className="text-foreground font-semibold">{esc.workOrder.assignedTo.name}</span></>
                      : <span className="text-opsly-high">Unassigned</span>}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] font-semibold rounded-lg bg-opsly-urgent/10 border-opsly-urgent/25 text-opsly-urgent hover:bg-opsly-urgent hover:text-white hover:border-opsly-urgent transition-colors duration-200"
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
            </div>
          ))}
      </div>
    </div>
  );
}
