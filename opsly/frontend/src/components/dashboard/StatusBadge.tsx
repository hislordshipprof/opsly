import { Badge } from '@/components/ui/badge';
import { WorkOrderStatus } from '@/types';

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; className: string; dot: string }> = {
  [WorkOrderStatus.REPORTED]: {
    label: 'Reported',
    dot: 'bg-slate-400',
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
  [WorkOrderStatus.TRIAGED]: {
    label: 'Triaged',
    dot: 'bg-opsly-medium',
    className: 'bg-opsly-medium/10 text-opsly-medium border-opsly-medium/20',
  },
  [WorkOrderStatus.ASSIGNED]: {
    label: 'Assigned',
    dot: 'bg-opsly-purple',
    className: 'bg-opsly-purple/10 text-opsly-purple border-opsly-purple/20',
  },
  [WorkOrderStatus.EN_ROUTE]: {
    label: 'En Route',
    dot: 'bg-opsly-medium',
    className: 'bg-opsly-medium/10 text-opsly-medium border-opsly-medium/20',
  },
  [WorkOrderStatus.IN_PROGRESS]: {
    label: 'In Progress',
    dot: 'bg-opsly-high',
    className: 'bg-opsly-high/10 text-opsly-high border-opsly-high/20',
  },
  [WorkOrderStatus.NEEDS_PARTS]: {
    label: 'Needs Parts',
    dot: 'bg-opsly-high',
    className: 'bg-opsly-high/10 text-opsly-high border-opsly-high/20',
  },
  [WorkOrderStatus.COMPLETED]: {
    label: 'Completed',
    dot: 'bg-opsly-low',
    className: 'bg-opsly-low/10 text-opsly-low border-opsly-low/20',
  },
  [WorkOrderStatus.ESCALATED]: {
    label: 'Escalated',
    dot: 'bg-opsly-urgent',
    className: 'bg-opsly-urgent/10 text-opsly-urgent border-opsly-urgent/20',
  },
  [WorkOrderStatus.CANCELLED]: {
    label: 'Cancelled',
    dot: 'bg-slate-400',
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  },
};

interface StatusBadgeProps {
  status: WorkOrderStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={`${config.className} text-xs font-medium gap-1.5 ${className}`}>
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </Badge>
  );
}
