import { useQuery } from '@tanstack/react-query';
import { getTechnicianSummaries } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TechnicianSummary } from '@/types';

const STATUS_DISPLAY: Record<string, { label: string }> = {
  ASSIGNED: { label: 'Assigned' },
  EN_ROUTE: { label: 'En Route' },
  IN_PROGRESS: { label: 'In Progress' },
  NEEDS_PARTS: { label: 'Needs Parts' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function TechnicianCard({ tech }: { tech: TechnicianSummary }) {
  const isAvailable = tech.activeOrders === 0;
  const statusInfo = tech.currentStatus
    ? STATUS_DISPLAY[tech.currentStatus] ?? { label: tech.currentStatus }
    : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-transparent hover:border-border transition-colors">
      {/* Avatar with status dot */}
      <div className="relative shrink-0">
        <div className="size-10 rounded-full bg-indigo-100/60 dark:bg-primary/10 flex items-center justify-center ring-1 ring-white/50 dark:ring-border">
          <span className="text-sm font-bold text-indigo-700 dark:text-primary">
            {getInitials(tech.name)}
          </span>
        </div>
        <span className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white dark:border-card ${
          isAvailable ? 'bg-emerald-500' : 'bg-amber-500'
        }`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{tech.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isAvailable ? (
            'Available'
          ) : (
            <>
              {statusInfo?.label ?? 'Working'}
              {tech.currentOrderNumber && (
                <span className="font-mono ml-1">{tech.currentOrderNumber}</span>
              )}
            </>
          )}
        </p>
      </div>

      {/* Status tag */}
      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ring-1 ring-inset backdrop-blur-sm ${
        isAvailable
          ? 'bg-emerald-50/80 text-emerald-700 ring-emerald-600/20 dark:bg-opsly-low/10 dark:text-opsly-low dark:ring-opsly-low/20'
          : 'bg-amber-50/80 text-amber-700 ring-amber-600/20 dark:bg-opsly-high/10 dark:text-opsly-high dark:ring-opsly-high/20'
      }`}>
        {isAvailable ? 'Free' : 'On Job'}
      </span>
    </div>
  );
}

export function TechnicianPanel() {
  const { data: technicians, isLoading } = useQuery<TechnicianSummary[]>({
    queryKey: QUERY_KEYS.technicians(),
    queryFn: getTechnicianSummaries,
    refetchInterval: false,
  });

  const available = technicians?.filter((t) => t.activeOrders === 0).length ?? 0;
  const total = technicians?.length ?? 0;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Technicians</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {available} of {total} available
          </p>
        </div>
        <span className={`size-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
          available > 0
            ? 'bg-opsly-low/15 text-opsly-low'
            : 'bg-opsly-high/15 text-opsly-high'
        }`}>
          {available}
        </span>
      </div>

      <ScrollArea className="max-h-[320px]">
        <div className="px-5 pb-4 space-y-1.5">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {technicians?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No technicians found.
            </p>
          )}

          {/* Available first, then by workload ascending */}
          {technicians
            ?.slice()
            .sort((a, b) => a.activeOrders - b.activeOrders)
            .map((tech) => (
              <TechnicianCard key={tech.id} tech={tech} />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
