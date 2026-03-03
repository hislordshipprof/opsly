import { useQuery } from '@tanstack/react-query';
import { getTechnicianSummaries } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TechnicianSummary } from '@/types';

const STATUS_DISPLAY: Record<string, { label: string; dot: string }> = {
  ASSIGNED: { label: 'Assigned', dot: 'bg-opsly-purple' },
  EN_ROUTE: { label: 'En Route', dot: 'bg-opsly-medium' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-opsly-high' },
  NEEDS_PARTS: { label: 'Needs Parts', dot: 'bg-opsly-high' },
};

function TechnicianCard({ tech }: { tech: TechnicianSummary }) {
  const isAvailable = tech.activeOrders === 0;
  const statusInfo = tech.currentStatus
    ? STATUS_DISPLAY[tech.currentStatus] ?? { label: tech.currentStatus, dot: 'bg-slate-400' }
    : null;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-transparent hover:border-border transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {/* Status dot */}
        <span className={`size-2.5 rounded-full shrink-0 ${
          isAvailable ? 'bg-opsly-low' : (statusInfo?.dot ?? 'bg-slate-400')
        }`} />

        <div className="min-w-0">
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
      </div>

      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
        isAvailable
          ? 'bg-opsly-low/10 text-opsly-low'
          : tech.activeOrders >= 4
            ? 'bg-opsly-high/10 text-opsly-high'
            : 'bg-primary/10 text-primary'
      }`}>
        {tech.activeOrders} job{tech.activeOrders !== 1 ? 's' : ''}
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
                <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />
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
