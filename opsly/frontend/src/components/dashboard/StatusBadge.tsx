import { Badge } from '@/components/ui/badge';
import { WorkOrderStatus } from '@/types';

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; className: string; dot: string }> = {
  [WorkOrderStatus.REPORTED]: {
    label: 'Reported',
    dot: 'bg-slate-500',
    className: 'bg-slate-50/80 text-slate-700 ring-1 ring-inset ring-slate-600/20 backdrop-blur-sm dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20',
  },
  [WorkOrderStatus.TRIAGED]: {
    label: 'Triaged',
    dot: 'bg-blue-500',
    className: 'bg-blue-50/80 text-blue-700 ring-1 ring-inset ring-blue-600/20 backdrop-blur-sm dark:bg-opsly-medium/10 dark:text-opsly-medium dark:ring-opsly-medium/20',
  },
  [WorkOrderStatus.ASSIGNED]: {
    label: 'Assigned',
    dot: 'bg-primary',
    className: 'bg-indigo-50/80 text-indigo-700 ring-1 ring-inset ring-indigo-600/20 backdrop-blur-sm dark:bg-primary/10 dark:text-primary dark:ring-primary/20',
  },
  [WorkOrderStatus.EN_ROUTE]: {
    label: 'En Route',
    dot: 'bg-blue-500',
    className: 'bg-blue-50/80 text-blue-700 ring-1 ring-inset ring-blue-600/20 backdrop-blur-sm dark:bg-opsly-medium/10 dark:text-opsly-medium dark:ring-opsly-medium/20',
  },
  [WorkOrderStatus.IN_PROGRESS]: {
    label: 'In Progress',
    dot: 'bg-amber-500',
    className: 'bg-amber-50/80 text-amber-700 ring-1 ring-inset ring-amber-600/20 backdrop-blur-sm dark:bg-opsly-high/10 dark:text-opsly-high dark:ring-opsly-high/20',
  },
  [WorkOrderStatus.NEEDS_PARTS]: {
    label: 'Needs Parts',
    dot: 'bg-amber-500',
    className: 'bg-amber-50/80 text-amber-700 ring-1 ring-inset ring-amber-600/20 backdrop-blur-sm dark:bg-opsly-high/10 dark:text-opsly-high dark:ring-opsly-high/20',
  },
  [WorkOrderStatus.COMPLETED]: {
    label: 'Completed',
    dot: 'bg-emerald-500',
    className: 'bg-emerald-50/80 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 backdrop-blur-sm dark:bg-opsly-low/10 dark:text-opsly-low dark:ring-opsly-low/20',
  },
  [WorkOrderStatus.ESCALATED]: {
    label: 'Escalated',
    dot: 'bg-rose-500',
    className: 'bg-rose-50/80 text-rose-700 ring-1 ring-inset ring-rose-600/20 backdrop-blur-sm dark:bg-opsly-urgent/10 dark:text-opsly-urgent dark:ring-opsly-urgent/20',
  },
  [WorkOrderStatus.CANCELLED]: {
    label: 'Cancelled',
    dot: 'bg-slate-400',
    className: 'bg-slate-50/80 text-slate-600 ring-1 ring-inset ring-slate-500/20 backdrop-blur-sm dark:bg-slate-500/10 dark:text-slate-500 dark:ring-slate-500/20',
  },
};

interface StatusBadgeProps {
  status: WorkOrderStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={`${config.className} text-xs font-bold gap-1.5 border-transparent ${className}`}>
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </Badge>
  );
}
