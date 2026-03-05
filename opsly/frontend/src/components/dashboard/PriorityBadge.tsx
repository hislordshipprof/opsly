import { Badge } from '@/components/ui/badge';
import { Priority } from '@/types';

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  [Priority.URGENT]: {
    label: 'Urgent',
    className: 'bg-rose-50/80 text-rose-800 ring-1 ring-inset ring-rose-600/20 backdrop-blur-sm dark:bg-opsly-urgent/10 dark:text-opsly-urgent dark:ring-opsly-urgent/20',
  },
  [Priority.HIGH]: {
    label: 'High',
    className: 'bg-orange-50/80 text-orange-800 ring-1 ring-inset ring-orange-600/20 backdrop-blur-sm dark:bg-opsly-high/10 dark:text-opsly-high dark:ring-opsly-high/20',
  },
  [Priority.MEDIUM]: {
    label: 'Medium',
    className: 'bg-indigo-50/80 text-indigo-800 ring-1 ring-inset ring-indigo-600/20 backdrop-blur-sm dark:bg-opsly-medium/10 dark:text-opsly-medium dark:ring-opsly-medium/20',
  },
  [Priority.LOW]: {
    label: 'Low',
    className: 'bg-emerald-50/80 text-emerald-800 ring-1 ring-inset ring-emerald-600/20 backdrop-blur-sm dark:bg-opsly-low/10 dark:text-opsly-low dark:ring-opsly-low/20',
  },
};

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <Badge variant="outline" className={`${config.className} text-xs font-semibold border-transparent ${className}`}>
      {config.label}
    </Badge>
  );
}
