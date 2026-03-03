import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStopStatus } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { SlaCountdown } from '@/components/dashboard/SlaCountdown';
import { Button } from '@/components/ui/button';
import type { ScheduleStop } from '@/types';
import { StopStatus } from '@/types';

interface JobDetailProps {
  stop: ScheduleStop;
  onBack: () => void;
}

const NEXT_STATUS: Partial<Record<StopStatus, { status: StopStatus; label: string; icon: string }>> = {
  [StopStatus.PENDING]:  { status: StopStatus.EN_ROUTE,  label: 'Start En Route', icon: '&#9654;' },
  [StopStatus.EN_ROUTE]: { status: StopStatus.ARRIVED,   label: 'Mark Arrived',   icon: '&#128205;' },
  [StopStatus.ARRIVED]:  { status: StopStatus.COMPLETED, label: 'Mark Complete',   icon: '&#10003;' },
};

export function JobDetailPanel({ stop, onBack }: JobDetailProps) {
  const wo = stop.workOrder;
  const queryClient = useQueryClient();
  const next = NEXT_STATUS[stop.status];

  const mutation = useMutation({
    mutationFn: (status: StopStatus) => updateStopStatus(stop.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule() });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });

  const severity = wo.visionAssessment;

  return (
    <div className="glass-card flex-1 flex flex-col p-8 min-h-[500px]">
      {/* Header */}
      <header className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground mb-4 transition-colors"
        >
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Queue
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-mono text-3xl font-extrabold">{wo.orderNumber}</h1>
              <PriorityBadge priority={wo.priority} />
              <StatusBadge status={wo.status} />
            </div>
          </div>
          <SlaCountdown slaDeadline={wo.slaDeadline} slaBreached={wo.slaBreached} />
        </div>
      </header>

      {/* 2x2 Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
        {/* Location */}
        <div className="flex gap-4">
          <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Location Details</p>
            <p className="text-base font-bold">{wo.unit.property.address} / {wo.unit.unitNumber}</p>
            <p className="text-sm text-muted-foreground">
              {wo.unit.floor != null ? `Floor ${wo.unit.floor}` : 'Ground Floor'}
            </p>
          </div>
        </div>

        {/* Issue */}
        <div className="flex gap-4">
          <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Issue Category</p>
            <p className="text-base font-bold capitalize">{wo.issueCategory.replace(/_/g, ' ')}</p>
            <p className="text-sm text-muted-foreground">Reported by {wo.reportedBy.name}</p>
          </div>
        </div>

        {/* Tenant */}
        <div className="flex gap-4">
          <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tenant Information</p>
            <p className="text-base font-bold">{wo.reportedBy.name}</p>
            <p className="text-sm text-muted-foreground">{wo.reportedBy.email ?? 'No contact info'}</p>
          </div>
        </div>

        {/* SLA / Schedule */}
        <div className="flex gap-4">
          <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">SLA Deadline</p>
            <p className="text-base font-bold">
              {wo.slaDeadline
                ? new Date(wo.slaDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'No deadline'}
            </p>
            <p className="text-sm text-muted-foreground">
              {wo.slaBreached ? 'SLA Breached' : 'Within SLA window'}
            </p>
          </div>
        </div>

        {/* Description — full width */}
        <div className="lg:col-span-2 mt-2">
          <div className="p-5 rounded-2xl bg-muted/30 border border-border/40">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Issue Description</p>
            <p className="text-sm leading-relaxed">{wo.issueDescription}</p>
          </div>
        </div>
      </div>

      {/* AI Assessment (if available) */}
      {severity && (
        <div className="mt-6 p-5 rounded-2xl bg-muted/30 border border-border/40">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">AI Assessment</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Damage Type</p>
              <p className="text-sm font-semibold capitalize mt-0.5">{severity.damageType?.replace(/_/g, ' ') ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Severity</p>
              <p className={`text-sm font-bold mt-0.5 ${
                severity.severity === 'HIGH' ? 'text-opsly-urgent' :
                severity.severity === 'MEDIUM' ? 'text-opsly-high' : 'text-opsly-low'
              }`}>{severity.severity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="text-sm font-mono font-semibold mt-0.5">{Math.round((severity.confidence ?? 0) * 100)}%</p>
            </div>
          </div>
          {severity.description && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{severity.description}</p>
          )}
          {severity.recommendations?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold mb-1">Recommendations:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {severity.recommendations.map((r: string, i: number) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-primary shrink-0">&bull;</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Completed state */}
      {stop.status === StopStatus.COMPLETED && (
        <div className="mt-6 p-5 rounded-2xl bg-opsly-low/8 border border-opsly-low/15 text-center">
          <span className="text-opsly-low font-bold text-sm">Job Complete</span>
          {wo.resolutionNotes && (
            <p className="text-xs text-muted-foreground mt-1">{wo.resolutionNotes}</p>
          )}
        </div>
      )}

      {/* Action Button — pinned to bottom */}
      {next && (
        <div className="mt-auto pt-8">
          <Button
            className="w-full h-14 rounded-2xl text-base font-bold shadow-lg"
            onClick={() => mutation.mutate(next.status)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Updating...' : next.label}
          </Button>
        </div>
      )}
    </div>
  );
}
