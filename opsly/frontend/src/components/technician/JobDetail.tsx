import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStopStatus } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import type { ScheduleStop } from '@/types';
import { StopStatus } from '@/types';

interface JobDetailProps {
  stop: ScheduleStop;
  onBack: () => void;
}

const NEXT_STATUS: Partial<Record<StopStatus, { status: StopStatus; label: string; color: string }>> = {
  [StopStatus.PENDING]: { status: StopStatus.EN_ROUTE, label: 'Start En Route', color: 'bg-primary hover:bg-primary/90' },
  [StopStatus.EN_ROUTE]: { status: StopStatus.ARRIVED, label: 'Mark Arrived', color: 'bg-opsly-high hover:bg-opsly-high/90' },
  [StopStatus.ARRIVED]: { status: StopStatus.COMPLETED, label: 'Mark Complete', color: 'bg-opsly-low hover:bg-opsly-low/90' },
};

export function JobDetail({ stop, onBack }: JobDetailProps) {
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
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-5">
        <button
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1"
        >
          &larr; Back to queue
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-lg font-bold text-primary">{wo.orderNumber}</span>
          <PriorityBadge priority={wo.priority} />
          <StatusBadge status={wo.status} />
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0 pt-0.5">Location</span>
            <span className="text-sm font-medium">
              {wo.unit.property.address}, Unit {wo.unit.unitNumber}
              {wo.unit.floor != null && ` (Floor ${wo.unit.floor})`}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0 pt-0.5">Issue</span>
            <span className="text-sm">{wo.issueCategory.replace('_', ' ')}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0 pt-0.5">Tenant</span>
            <span className="text-sm">{wo.reportedBy.name}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="glass-card p-5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Issue Description</h4>
        <p className="text-sm leading-relaxed">{wo.issueDescription}</p>
      </div>

      {/* AI Assessment (if available) */}
      {severity && (
        <div className="glass-card p-5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">AI Assessment</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Damage Type</span>
              <span className="font-medium capitalize">{severity.damageType?.replace(/_/g, ' ') ?? '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Severity</span>
              <span className={`font-semibold ${
                severity.severity === 'HIGH' ? 'text-opsly-urgent' :
                severity.severity === 'MEDIUM' ? 'text-opsly-high' : 'text-opsly-low'
              }`}>{severity.severity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-mono">{Math.round((severity.confidence ?? 0) * 100)}%</span>
            </div>
            {severity.description && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{severity.description}</p>
            )}
            {severity.recommendations?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium mb-1">Recommendations:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {severity.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-primary shrink-0">-</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      {next && (
        <Button
          className={`w-full h-12 text-sm font-semibold text-white rounded-2xl ${next.color}`}
          onClick={() => mutation.mutate(next.status)}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Updating...' : next.label}
        </Button>
      )}

      {stop.status === StopStatus.COMPLETED && (
        <div className="glass-card p-5 text-center">
          <span className="text-opsly-low font-semibold text-sm">Job Complete</span>
          {wo.resolutionNotes && (
            <p className="text-xs text-muted-foreground mt-1">{wo.resolutionNotes}</p>
          )}
        </div>
      )}
    </div>
  );
}
