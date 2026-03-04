import { useQuery } from '@tanstack/react-query';
import { getProperties, getUsers } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkOrderStatus, Priority } from '@/types';

const STATUS_OPTIONS = [
  { value: WorkOrderStatus.REPORTED, label: 'Reported' },
  { value: WorkOrderStatus.TRIAGED, label: 'Triaged' },
  { value: WorkOrderStatus.ASSIGNED, label: 'Assigned' },
  { value: WorkOrderStatus.EN_ROUTE, label: 'En Route' },
  { value: WorkOrderStatus.IN_PROGRESS, label: 'In Progress' },
  { value: WorkOrderStatus.NEEDS_PARTS, label: 'Needs Parts' },
  { value: WorkOrderStatus.COMPLETED, label: 'Completed' },
  { value: WorkOrderStatus.ESCALATED, label: 'Escalated' },
];

const PRIORITY_OPTIONS = [
  { value: Priority.URGENT, label: 'Urgent' },
  { value: Priority.HIGH, label: 'High' },
  { value: Priority.MEDIUM, label: 'Medium' },
  { value: Priority.LOW, label: 'Low' },
];

export function FilterBar() {
  const { filters, setFilter, clearFilters } = useDashboardStore();

  const { data: properties } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: QUERY_KEYS.properties(),
    queryFn: getProperties,
  });

  const { data: technicians } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: QUERY_KEYS.users('TECHNICIAN'),
    queryFn: () => getUsers('TECHNICIAN'),
  });

  const hasActiveFilters = Object.values(filters).some((v) => v != null);

  return (
    <div className="glass-strip px-4 py-3 flex flex-wrap items-center gap-3">
      {/* Property filter */}
      <Select
        value={filters.propertyId ?? ''}
        onValueChange={(v) => setFilter('propertyId', v || null)}
      >
        <SelectTrigger className="w-[180px] h-9 rounded-xl bg-card/60 backdrop-blur-sm border-border text-sm">
          <SelectValue placeholder="All Properties" />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl border border-border bg-popover shadow-lg backdrop-blur-xl">
          {properties?.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.status ?? ''}
        onValueChange={(v) => setFilter('status', (v || null) as WorkOrderStatus | null)}
      >
        <SelectTrigger className="w-[160px] h-9 rounded-xl bg-card/60 backdrop-blur-sm border-border text-sm">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl border border-border bg-popover shadow-lg backdrop-blur-xl">
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority filter */}
      <Select
        value={filters.priority ?? ''}
        onValueChange={(v) => setFilter('priority', (v || null) as Priority | null)}
      >
        <SelectTrigger className="w-[150px] h-9 rounded-xl bg-card/60 backdrop-blur-sm border-border text-sm">
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl border border-border bg-popover shadow-lg backdrop-blur-xl">
          {PRIORITY_OPTIONS.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Technician filter */}
      <Select
        value={filters.assignedToId ?? ''}
        onValueChange={(v) => setFilter('assignedToId', v || null)}
      >
        <SelectTrigger className="w-[180px] h-9 rounded-xl bg-card/60 backdrop-blur-sm border-border text-sm">
          <SelectValue placeholder="All Technicians" />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl border border-border bg-popover shadow-lg backdrop-blur-xl">
          {technicians?.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-muted-foreground hover:text-foreground rounded-xl"
          onClick={clearFilters}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
