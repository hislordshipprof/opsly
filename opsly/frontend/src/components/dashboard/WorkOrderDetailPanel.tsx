import { useQuery } from '@tanstack/react-query';
import { getWorkOrder, getWorkOrderEvents } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useWorkOrderEvents } from '@/hooks/useWebSocket';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { SlaCountdown } from './SlaCountdown';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { WorkOrderDetail as WorkOrderDetailType, WorkOrderEvent } from '@/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const EVENT_ICONS: Record<string, string> = {
  CREATED: 'C',
  STATUS_CHANGED: 'S',
  TECHNICIAN_ASSIGNED: 'T',
  PHOTO_UPLOADED: 'P',
  ETA_UPDATED: 'E',
  NOTE_ADDED: 'N',
  ESCALATED: '!',
  COMPLETED: 'D',
};

const EVENT_COLORS: Record<string, string> = {
  CREATED: 'bg-muted-foreground',
  STATUS_CHANGED: 'bg-opsly-medium',
  TECHNICIAN_ASSIGNED: 'bg-primary',
  PHOTO_UPLOADED: 'bg-opsly-teal',
  ETA_UPDATED: 'bg-opsly-high',
  NOTE_ADDED: 'bg-muted-foreground',
  ESCALATED: 'bg-opsly-urgent',
  COMPLETED: 'bg-opsly-low',
};

function EventTimeline({ events }: { events: WorkOrderEvent[] }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground py-4">No events yet.</p>;
  }

  return (
    <div className="relative space-y-0">
      {events.map((event, i) => (
        <div key={event.id} className="flex gap-3 pb-4 last:pb-0">
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center">
            <div className={`size-7 rounded-full ${EVENT_COLORS[event.eventType] ?? 'bg-muted-foreground'} flex items-center justify-center shrink-0`}>
              <span className="text-[10px] font-bold text-white">
                {EVENT_ICONS[event.eventType] ?? '?'}
              </span>
            </div>
            {i < events.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-medium leading-tight">
              {event.notes ?? event.eventType.replace(/_/g, ' ').toLowerCase()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatDate(event.createdAt)}
              </span>
              {event.actor && (
                <span className="text-xs text-muted-foreground">
                  by {event.actor.name}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded" />
      <div className="h-4 w-full bg-muted rounded" />
      <div className="h-4 w-3/4 bg-muted rounded" />
      <div className="h-20 bg-muted rounded-xl" />
      <div className="h-40 bg-muted rounded-xl" />
    </div>
  );
}

export function WorkOrderDetailPanel() {
  const { selectedWorkOrderId, selectWorkOrder, openAssignModal } = useDashboardStore();

  const { data: workOrder, isLoading } = useQuery<WorkOrderDetailType>({
    queryKey: QUERY_KEYS.workOrder(selectedWorkOrderId ?? ''),
    queryFn: () => getWorkOrder(selectedWorkOrderId!),
    enabled: !!selectedWorkOrderId,
  });

  const { data: events } = useQuery<WorkOrderEvent[]>({
    queryKey: QUERY_KEYS.workOrderEvents(selectedWorkOrderId ?? ''),
    queryFn: () => getWorkOrderEvents(selectedWorkOrderId!),
    enabled: !!selectedWorkOrderId,
  });

  // Subscribe to real-time updates for this work order
  useWorkOrderEvents(selectedWorkOrderId);

  if (!selectedWorkOrderId) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={() => selectWorkOrder(null)}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] z-50 animate-in slide-in-from-right duration-300">
        <div className="h-full glass-card-heavy rounded-l-3xl overflow-hidden flex flex-col">
          {/* Header with close button */}
          <div className="p-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {isLoading || !workOrder ? (
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-mono text-xl font-extrabold text-primary">
                        {workOrder.orderNumber}
                      </h3>
                      <PriorityBadge priority={workOrder.priority} />
                      <StatusBadge status={workOrder.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      {workOrder.property.name} / Unit {workOrder.unit.unitNumber}
                      {workOrder.unit.floor != null && ` (Floor ${workOrder.unit.floor})`}
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={() => selectWorkOrder(null)}
                className="shrink-0 size-8 rounded-xl hover:bg-muted/50 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Close panel"
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <ScrollArea className="flex-1">
            {isLoading || !workOrder ? (
              <div className="p-6">
                <DetailSkeleton />
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Issue Category & Description */}
                <div className="glass-card p-5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Issue Category
                  </p>
                  <p className="text-base font-bold capitalize mb-3">
                    {workOrder.issueCategory.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Description
                  </p>
                  <p className="text-sm leading-relaxed">{workOrder.issueDescription}</p>
                </div>

                {/* Location Details */}
                <div className="glass-card p-5">
                  <div className="flex gap-3">
                    <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Location
                      </p>
                      <p className="text-base font-bold">{workOrder.property.address}</p>
                      <p className="text-sm text-muted-foreground">
                        Unit {workOrder.unit.unitNumber}
                        {workOrder.unit.floor != null && ` — Floor ${workOrder.unit.floor}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tenant Information */}
                <div className="glass-card p-5">
                  <div className="flex gap-3">
                    <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Reported By
                      </p>
                      <p className="text-base font-bold">{workOrder.reportedBy.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {workOrder.reportedBy.email ?? 'No contact info'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SLA Deadline */}
                <div className="glass-card p-5">
                  <div className="flex gap-3">
                    <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        SLA Deadline
                      </p>
                      <p className="text-base font-bold">
                        {workOrder.slaDeadline
                          ? new Date(workOrder.slaDeadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No deadline'}
                      </p>
                      <div className="mt-2">
                        <SlaCountdown
                          slaDeadline={workOrder.slaDeadline}
                          slaBreached={workOrder.slaBreached}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Technician */}
                <div className="glass-card p-5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Assigned Technician
                  </p>
                  {workOrder.assignedTo ? (
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-full bg-indigo-100/80 dark:bg-primary/10 flex items-center justify-center ring-2 ring-white/50 dark:ring-primary/5">
                        <span className="text-sm font-bold text-indigo-700 dark:text-primary">
                          {workOrder.assignedTo.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-bold">{workOrder.assignedTo.name}</p>
                        <p className="text-xs text-muted-foreground">{workOrder.assignedTo.email}</p>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-xl bg-primary hover:bg-primary/90"
                      onClick={() => openAssignModal(workOrder.id)}
                    >
                      Assign Technician
                    </Button>
                  )}
                </div>

                {/* Photo Display */}
                {workOrder.photoUrls && workOrder.photoUrls.length > 0 ? (
                  <div className="glass-card p-5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                      Damage Photos
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {workOrder.photoUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Photo ${i + 1}`}
                          className="w-full aspect-square object-cover rounded-xl border border-border/50"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-5">
                    <p className="text-sm text-muted-foreground text-center py-3">
                      No photos attached
                    </p>
                  </div>
                )}

                {/* AI Assessment */}
                {workOrder.visionAssessment && (
                  <div className="glass-card p-5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                      AI Assessment
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Damage Type</p>
                        <p className="text-sm font-semibold capitalize mt-0.5">
                          {(workOrder.visionAssessment.damageType ?? '--').replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Severity</p>
                        <p
                          className={`text-sm font-bold mt-0.5 ${
                            workOrder.visionAssessment.severity === 'HIGH'
                              ? 'text-opsly-urgent'
                              : workOrder.visionAssessment.severity === 'MEDIUM'
                                ? 'text-opsly-high'
                                : 'text-opsly-low'
                          }`}
                        >
                          {workOrder.visionAssessment.severity ?? '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="text-sm font-mono font-semibold mt-0.5">
                          {workOrder.visionAssessment.confidence != null
                            ? `${Math.round(workOrder.visionAssessment.confidence * 100)}%`
                            : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rec. Priority</p>
                        <p className="text-sm font-semibold mt-0.5">
                          {workOrder.visionAssessment.recommendedPriority ?? '--'}
                        </p>
                      </div>
                    </div>
                    {workOrder.visionAssessment.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {workOrder.visionAssessment.description}
                      </p>
                    )}
                  </div>
                )}

                {/* AI Severity Score */}
                {workOrder.aiSeverityScore != null && (
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        AI Severity Score
                      </p>
                      <span className="font-mono font-semibold text-sm">
                        {Math.round(workOrder.aiSeverityScore * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          workOrder.aiSeverityScore > 0.7
                            ? 'bg-opsly-urgent'
                            : workOrder.aiSeverityScore > 0.4
                              ? 'bg-opsly-high'
                              : 'bg-opsly-low'
                        }`}
                        style={{ width: `${workOrder.aiSeverityScore * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Activity Timeline */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Activity Timeline
                  </p>
                  <EventTimeline events={events ?? []} />
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
