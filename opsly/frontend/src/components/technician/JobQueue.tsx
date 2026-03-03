import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { SlaCountdown } from '@/components/dashboard/SlaCountdown';
import type { ScheduleStop } from '@/types';
import { StopStatus } from '@/types';

interface JobQueueProps {
  stops: ScheduleStop[];
  activeStopId: string | null;
  onSelectStop: (stopId: string) => void;
}

const STOP_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Queued',
  EN_ROUTE: 'En Route',
  ARRIVED: 'On Site',
  COMPLETED: 'Done',
  SKIPPED: 'Skipped',
};

export function JobQueue({ stops, activeStopId, onSelectStop }: JobQueueProps) {
  const completed = stops.filter((s) => s.status === StopStatus.COMPLETED || s.status === StopStatus.SKIPPED).length;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Today's Jobs</h3>
          <span className="text-xs text-muted-foreground font-mono">
            {completed}/{stops.length} complete
          </span>
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {stops.map((stop) => {
          const wo = stop.workOrder;
          const isActive = stop.id === activeStopId;
          const isDone = stop.status === StopStatus.COMPLETED || stop.status === StopStatus.SKIPPED;

          return (
            <div
              key={stop.id}
              className={`px-5 py-4 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-primary/[0.06] border-l-2 border-l-primary'
                  : isDone
                    ? 'opacity-60'
                    : 'hover:bg-primary/[0.03]'
              }`}
              onClick={() => onSelectStop(stop.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Sequence number */}
                  <span className={`size-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-opsly-low/15 text-opsly-low'
                      : stop.status === StopStatus.EN_ROUTE || stop.status === StopStatus.ARRIVED
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? '\u2713' : stop.sequenceNumber}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {wo.orderNumber}
                      </span>
                      <PriorityBadge priority={wo.priority} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {wo.unit.property.address} / {wo.unit.unitNumber}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isDone ? 'bg-opsly-low/10 text-opsly-low'
                      : stop.status === StopStatus.ARRIVED ? 'bg-opsly-high/10 text-opsly-high'
                        : stop.status === StopStatus.EN_ROUTE ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                  }`}>
                    {STOP_STATUS_LABEL[stop.status] ?? stop.status}
                  </span>
                  <SlaCountdown slaDeadline={wo.slaDeadline} slaBreached={wo.slaBreached} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
