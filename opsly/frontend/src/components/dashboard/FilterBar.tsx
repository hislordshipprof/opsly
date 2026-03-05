import { useState } from 'react';
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

const glassTriggerCls = 'h-9 rounded-lg border border-white/30 bg-white/50 dark:bg-card/60 dark:border-border backdrop-blur-md shadow-sm hover:bg-white/70 dark:hover:bg-card/80 text-sm';

export function FilterBar() {
  const { filters, setFilter, clearFilters } = useDashboardStore();
  const [search, setSearch] = useState('');

  const { data: properties, isLoading: propertiesLoading } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: QUERY_KEYS.properties(),
    queryFn: getProperties,
  });

  const { data: technicians, isLoading: techniciansLoading } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: QUERY_KEYS.users('TECHNICIAN'),
    queryFn: () => getUsers('TECHNICIAN'),
  });

  const hasActiveFilters = Object.values(filters).some((v) => v != null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Property filter */}
      <Select
        value={filters.propertyId ?? ''}
        onValueChange={(v) => setFilter('propertyId', v || null)}
      >
        <SelectTrigger className={`w-[180px] ${glassTriggerCls}`}>
          <SelectValue placeholder="All Properties" />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl border border-border bg-popover shadow-lg backdrop-blur-xl">
          {propertiesLoading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground animate-pulse">Loading...</div>
          ) : properties?.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">No properties</div>
          ) : (
            properties?.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.status ?? ''}
        onValueChange={(v) => setFilter('status', (v || null) as WorkOrderStatus | null)}
      >
        <SelectTrigger className={`w-[160px] ${glassTriggerCls}`}>
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
        <SelectTrigger className={`w-[150px] ${glassTriggerCls}`}>
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
        <SelectTrigger className={`w-[180px] ${glassTriggerCls}`}>
          <SelectValue placeholder="All Technicians" />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl border border-border bg-popover shadow-lg backdrop-blur-xl">
          {techniciansLoading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground animate-pulse">Loading...</div>
          ) : technicians?.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">No technicians</div>
          ) : (
            technicians?.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className="h-9 w-[200px] rounded-lg border border-white/30 dark:border-border bg-white/50 dark:bg-card/60 backdrop-blur-md pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-muted-foreground hover:text-foreground rounded-lg"
          onClick={clearFilters}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
