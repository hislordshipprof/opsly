import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkOrder, getWorkOrderEvents, updateWorkOrderStatus, getActiveEscalations, acknowledgeEscalation } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useWorkOrderEvents } from '@/hooks/useWebSocket';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { SlaCountdown } from './SlaCountdown';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkOrderStatus } from '@/types';
import type { WorkOrderDetail as WorkOrderDetailType, WorkOrderEvent } from '@/types';
import { formatDate } from '@/lib/time';

/** Soft tinted background for timeline dots */
const EVENT_DOT_BG: Record<string, string> = {
  CREATED: 'bg-muted',
  STATUS_CHANGED: 'bg-opsly-medium/15',
  TECHNICIAN_ASSIGNED: 'bg-opsly-low/15',
  PHOTO_UPLOADED: 'bg-primary/15',
  ETA_UPDATED: 'bg-opsly-high/15',
  NOTE_ADDED: 'bg-muted',
  ESCALATED: 'bg-opsly-urgent/15',
  COMPLETED: 'bg-opsly-low/15',
};

/** Icon stroke color inside timeline dots */
const EVENT_ICON_COLOR: Record<string, string> = {
  CREATED: 'text-muted-foreground',
  STATUS_CHANGED: 'text-opsly-medium',
  TECHNICIAN_ASSIGNED: 'text-opsly-low',
  PHOTO_UPLOADED: 'text-primary',
  ETA_UPDATED: 'text-opsly-high',
  NOTE_ADDED: 'text-muted-foreground',
  ESCALATED: 'text-opsly-urgent',
  COMPLETED: 'text-opsly-low',
};

/** True when a timeline event represents a "needs parts" request with notes */
function isPartsRequestEvent(event: WorkOrderEvent): boolean {
  return event.toStatus === 'NEEDS_PARTS' && !!event.notes;
}

/** Render a human-readable title for a timeline event */
function eventTitle(event: WorkOrderEvent): string {
  if (isPartsRequestEvent(event)) return 'Parts Requested';
  if (event.eventType === 'STATUS_CHANGED' && event.toStatus) {
    const label = STATUS_LABELS[event.toStatus] ?? event.toStatus;
    return `Status changed to ${label}`;
  }
  if (event.eventType === 'TECHNICIAN_ASSIGNED' && event.notes) {
    return event.notes;
  }
  if (event.notes) return event.notes;
  return event.eventType.replace(/_/g, ' ').toLowerCase();
}

function PartsRequestedCard({ events }: { events: WorkOrderEvent[] }) {
  const partsEvent = events.find(isPartsRequestEvent);
  if (!partsEvent) return null;

  return (
    <div className="rounded-2xl border-[1.5px] border-opsly-high/30 bg-opsly-high/[0.04] overflow-hidden">
      {/* Gradient header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 bg-gradient-to-b from-opsly-high/10 to-transparent">
        <div className="size-8 rounded-lg bg-opsly-high flex items-center justify-center shrink-0">
          <svg className="size-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-opsly-high uppercase tracking-[0.15em] font-mono">
            Parts Requested
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            by {partsEvent.actor?.name ?? 'Technician'} &middot; {formatDate(partsEvent.createdAt)}
          </p>
        </div>
      </div>

      {/* "Items requested" label + white inset list */}
      <div className="px-4 pb-3">
        <p className="text-xs font-semibold text-opsly-high/80 mb-2">Items requested:</p>
        <div className="p-3 rounded-xl bg-background border border-opsly-high/20">
          <ul className="space-y-1.5">
            {partsEvent.notes!.split(/[,\n]+/).map((part, i) => {
              const trimmed = part.trim();
              if (!trimmed) return null;
              return (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="size-[6px] rounded-full bg-opsly-high shrink-0" />
                  <span className="text-sm font-medium capitalize">{trimmed}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-2 justify-center">
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-opsly-high text-white text-xs font-semibold hover:bg-amber-600 transition-colors">
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Acknowledge
        </button>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-secondary-foreground hover:border-primary hover:text-primary transition-colors">
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          Order Parts
        </button>
      </div>
    </div>
  );
}

/** SVG icon paths for each event type (Heroicons outline style) */
const EVENT_SVG: Record<string, React.ReactNode> = {
  CREATED: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  ),
  STATUS_CHANGED: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
  ),
  TECHNICIAN_ASSIGNED: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
  ),
  PHOTO_UPLOADED: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
  ),
  ETA_UPDATED: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  ),
  NOTE_ADDED: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  ),
  ESCALATED: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  ),
  COMPLETED: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  ),
};

/** Package icon for parts-request events */
const PARTS_SVG = (
  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
);

function EventTimeline({ events }: { events: WorkOrderEvent[] }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground py-4">No events yet.</p>;
  }

  return (
    <div className="relative space-y-0">
      {events.map((event, i) => {
        const isParts = isPartsRequestEvent(event);
        const dotColor = isParts
          ? 'bg-opsly-high/15'
          : (EVENT_DOT_BG[event.eventType] ?? 'bg-muted');
        const iconColor = isParts
          ? 'text-opsly-high'
          : (EVENT_ICON_COLOR[event.eventType] ?? 'text-muted-foreground');

        return (
          <div key={event.id} className="flex gap-3 pb-5 last:pb-0">
            {/* Timeline line + icon dot */}
            <div className="flex flex-col items-center">
              <div className={`size-8 rounded-full ${dotColor} flex items-center justify-center shrink-0`}>
                <svg className={`size-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  {isParts ? PARTS_SVG : (EVENT_SVG[event.eventType] ?? EVENT_SVG.CREATED)}
                </svg>
              </div>
              {i < events.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 pt-1">
              <p className={`text-sm font-semibold leading-tight ${isParts ? 'text-opsly-high' : ''}`}>
                {eventTitle(event)}
              </p>
              {isParts && event.notes && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {event.notes}
                </p>
              )}
              <p className="text-[11px] font-mono text-muted-foreground mt-1">
                {formatDate(event.createdAt)}
                {event.actor && <> &middot; {event.actor.name}</>}
              </p>
            </div>
          </div>
        );
      })}
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

// Valid next statuses a manager can move a work order to
const STATUS_TRANSITIONS: Partial<Record<WorkOrderStatus, WorkOrderStatus[]>> = {
  REPORTED: ['TRIAGED', 'ASSIGNED', 'CANCELLED'],
  TRIAGED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  EN_ROUTE: ['IN_PROGRESS'],
  IN_PROGRESS: ['NEEDS_PARTS', 'COMPLETED'],
  NEEDS_PARTS: ['IN_PROGRESS', 'COMPLETED'],
  ESCALATED: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
};

const STATUS_LABELS: Record<string, string> = {
  REPORTED: 'Reported',
  TRIAGED: 'Triaged',
  ASSIGNED: 'Assigned',
  EN_ROUTE: 'En Route',
  IN_PROGRESS: 'In Progress',
  NEEDS_PARTS: 'Needs Parts',
  COMPLETED: 'Completed',
  ESCALATED: 'Escalated',
  CANCELLED: 'Cancelled',
};

export function WorkOrderDetailPanel() {
  const { selectedWorkOrderId, selectWorkOrder, openAssignModal } = useDashboardStore();
  const queryClient = useQueryClient();

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

  // Fetch escalations to find matching escalation for this work order
  const { data: escalations } = useQuery<Array<{ id: string; workOrder: { id: string } }>>({
    queryKey: ['escalations'],
    queryFn: getActiveEscalations,
    enabled: !!workOrder && workOrder.status === 'ESCALATED',
  });

  const matchingEscalation = escalations?.find(
    (e) => e.workOrder.id === selectedWorkOrderId,
  );

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      updateWorkOrderStatus(selectedWorkOrderId!, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workOrder(selectedWorkOrderId!) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workOrderEvents(selectedWorkOrderId!) });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
    },
  });

  const ackMutation = useMutation({
    mutationFn: () => acknowledgeEscalation(matchingEscalation!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workOrder(selectedWorkOrderId!) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workOrderEvents(selectedWorkOrderId!) });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });

  // Subscribe to real-time updates for this work order
  useWorkOrderEvents(selectedWorkOrderId);

  const nextStatuses = workOrder
    ? STATUS_TRANSITIONS[workOrder.status as WorkOrderStatus] ?? []
    : [];
  const isTerminal = workOrder
    ? workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED'
    : true;

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
          <ScrollArea className="flex-1 min-h-0">
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

                {/* Parts Requested — prominent callout when status is NEEDS_PARTS */}
                {workOrder.status === 'NEEDS_PARTS' && events && (
                  <PartsRequestedCard events={events} />
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

          {/* Action Bar — only for non-terminal statuses */}
          {workOrder && !isTerminal && (
            <div className="border-t border-border/50 p-4 shrink-0 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                {/* Status Change Dropdown */}
                {nextStatuses.length > 0 && (
                  <Select
                    onValueChange={(value) => statusMutation.mutate(value)}
                    disabled={statusMutation.isPending}
                  >
                    <SelectTrigger className="w-[160px] rounded-xl h-9 text-sm">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {nextStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s] ?? s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex-1" />

                {/* Reassign Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => openAssignModal(workOrder.id)}
                >
                  Reassign
                </Button>

                {/* Acknowledge Escalation — only for ESCALATED orders */}
                {workOrder.status === 'ESCALATED' && matchingEscalation && (
                  <Button
                    size="sm"
                    className="rounded-xl bg-opsly-urgent hover:bg-opsly-urgent/90 text-white"
                    onClick={() => ackMutation.mutate()}
                    disabled={ackMutation.isPending}
                  >
                    {ackMutation.isPending ? 'Acknowledging...' : 'Acknowledge'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
