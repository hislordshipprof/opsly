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
import type { VisionAssessment } from '@/types';
import { Separator } from '@/components/ui/separator';
import type { WorkOrderDetail as WorkOrderDetailType, WorkOrderEvent } from '@/types';
import { formatDate } from '@/lib/time';

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

function VisionCard({ assessment }: { assessment: VisionAssessment }) {
  return (
    <div className="bg-card/40 rounded-xl p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        AI Assessment
      </p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Damage: </span>
          <span className="font-medium">{String(assessment.damageType ?? '--')}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Severity: </span>
          <span className="font-medium">{String(assessment.severity ?? '--')}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Confidence: </span>
          <span className="font-mono font-medium">
            {assessment.confidence != null
              ? `${Math.round(Number(assessment.confidence) * 100)}%`
              : '--'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Rec. Priority: </span>
          <span className="font-medium">{String(assessment.recommendedPriority ?? '--')}</span>
        </div>
      </div>
      {assessment.description ? (
        <p className="text-xs text-muted-foreground mt-1">
          {String(assessment.description)}
        </p>
      ) : null}
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

export function WorkOrderDetail() {
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
    return (
      <div className="glass-card p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-muted-foreground">
          Select a work order to view details
        </p>
      </div>
    );
  }

  if (isLoading || !workOrder) {
    return (
      <div className="glass-card p-6">
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-lg font-bold text-primary">
                {workOrder.orderNumber}
              </h3>
              <PriorityBadge priority={workOrder.priority} />
              <StatusBadge status={workOrder.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {workOrder.property.name} / Unit {workOrder.unit.unitNumber}
              {workOrder.unit.floor != null && ` (Floor ${workOrder.unit.floor})`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => selectWorkOrder(null)}
          >
            Close
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm mt-3 leading-relaxed">{workOrder.issueDescription}</p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs text-muted-foreground">
          <span>Reported by {workOrder.reportedBy.name}</span>
          <span>{formatDate(workOrder.createdAt)}</span>
          <SlaCountdown slaDeadline={workOrder.slaDeadline} slaBreached={workOrder.slaBreached} />
        </div>

        {/* Assigned technician or assign button */}
        <div className="mt-3">
          {workOrder.assignedTo ? (
            <span className="text-sm">
              <span className="text-muted-foreground">Assigned to </span>
              <span className="font-semibold">{workOrder.assignedTo.name}</span>
            </span>
          ) : (
            <Button
              size="sm"
              className="rounded-xl bg-primary hover:bg-primary/90 text-xs"
              onClick={() => openAssignModal(workOrder.id)}
            >
              Assign Technician
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* AI Vision Assessment */}
      {workOrder.visionAssessment && (
        <div className="px-6 pt-4">
          <VisionCard assessment={workOrder.visionAssessment} />
        </div>
      )}

      {/* Severity score bar */}
      {workOrder.aiSeverityScore != null && (
        <div className="px-6 pt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">AI Severity</span>
            <span className="font-mono font-semibold">
              {Math.round(workOrder.aiSeverityScore * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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

      <Separator className="mt-4" />

      {/* Event Timeline */}
      <div className="px-6 pt-4 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Activity Timeline
        </p>
        <ScrollArea className="max-h-[280px]">
          <EventTimeline events={events ?? []} />
        </ScrollArea>
      </div>
    </div>
  );
}
