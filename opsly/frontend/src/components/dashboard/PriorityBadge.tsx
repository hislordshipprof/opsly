import { Badge } from '@/components/ui/badge';
import { Priority } from '@/types';

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  [Priority.URGENT]: {
    label: 'Urgent',
    className: 'bg-opsly-urgent/10 text-opsly-urgent border-opsly-urgent/20 hover:bg-opsly-urgent/15',
  },
  [Priority.HIGH]: {
    label: 'High',
    className: 'bg-opsly-high/10 text-opsly-high border-opsly-high/20 hover:bg-opsly-high/15',
  },
  [Priority.MEDIUM]: {
    label: 'Medium',
    className: 'bg-opsly-medium/10 text-opsly-medium border-opsly-medium/20 hover:bg-opsly-medium/15',
  },
  [Priority.LOW]: {
    label: 'Low',
    className: 'bg-opsly-low/10 text-opsly-low border-opsly-low/20 hover:bg-opsly-low/15',
  },
};

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <Badge variant="outline" className={`${config.className} text-xs font-semibold ${className}`}>
      {config.label}
    </Badge>
  );
}
