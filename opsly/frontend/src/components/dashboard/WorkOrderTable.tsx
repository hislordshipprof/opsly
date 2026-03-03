import { useQuery } from '@tanstack/react-query';
import { getWorkOrders } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { useDashboardStore } from '@/stores/dashboardStore';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { SlaCountdown } from './SlaCountdown';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { WorkOrderListItem } from '@/types';

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TableSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded flex-1" />
            <div className="h-5 w-16 bg-muted rounded-full" />
            <div className="h-5 w-20 bg-muted rounded-full" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card p-12 text-center">
      <p className="text-muted-foreground text-sm">No work orders match the current filters.</p>
    </div>
  );
}

export function WorkOrderTable() {
  const { filters, selectWorkOrder, openAssignModal } = useDashboardStore();

  const queryParams: Record<string, string | number | undefined> = {
    ...(filters.propertyId && { propertyId: filters.propertyId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
    take: 50,
  };

  const { data: workOrders, isLoading } = useQuery<WorkOrderListItem[]>({
    queryKey: QUERY_KEYS.workOrders(queryParams as any),
    queryFn: () => getWorkOrders(queryParams),
    refetchInterval: false,
  });

  if (isLoading) return <TableSkeleton />;
  if (!workOrders?.length) return <EmptyState />;

  return (
    <div className="glass-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Order</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Unit</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Issue</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Priority</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Assigned To</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">SLA</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Reported</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workOrders.map((wo) => (
            <TableRow
              key={wo.id}
              className="cursor-pointer border-border transition-colors hover:bg-accent/50"
              onClick={() => selectWorkOrder(wo.id)}
            >
              <TableCell className="font-mono text-sm font-semibold text-primary">
                {wo.orderNumber}
              </TableCell>
              <TableCell className="text-sm">
                <span className="text-muted-foreground">{wo.property.name}</span>
                <span className="mx-1 text-muted-foreground/50">/</span>
                <span className="font-medium">{wo.unit.unitNumber}</span>
              </TableCell>
              <TableCell className="text-sm max-w-[200px] truncate">
                {wo.issueDescription}
              </TableCell>
              <TableCell>
                <PriorityBadge priority={wo.priority} />
              </TableCell>
              <TableCell>
                <StatusBadge status={wo.status} />
              </TableCell>
              <TableCell className="text-sm">
                {wo.assignedTo ? (
                  <span className="font-medium">{wo.assignedTo.name}</span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-full border-dashed border-primary/30 text-primary hover:bg-primary/5"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAssignModal(wo.id);
                    }}
                  >
                    Assign
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <SlaCountdown
                  slaDeadline={wo.slaDeadline}
                  slaBreached={wo.slaBreached}
                />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {timeAgo(wo.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
