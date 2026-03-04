import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTechnicianSummaries, assignTechnician } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { useDashboardStore } from '@/stores/dashboardStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { TechnicianSummary } from '@/types';

export function AssignTechnicianModal() {
  const { assignModalOrderId, closeAssignModal } = useDashboardStore();
  const queryClient = useQueryClient();
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  const { data: technicians, isLoading } = useQuery<TechnicianSummary[]>({
    queryKey: QUERY_KEYS.technicians(),
    queryFn: getTechnicianSummaries,
    enabled: !!assignModalOrderId,
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (!assignModalOrderId || !selectedTechId) {
        return Promise.reject(new Error('Missing order or technician'));
      }
      return assignTechnician(assignModalOrderId, selectedTechId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.technicians() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics() });
      setSelectedTechId(null);
      closeAssignModal();
    },
  });

  const handleClose = () => {
    setSelectedTechId(null);
    closeAssignModal();
  };

  return (
    <Dialog open={!!assignModalOrderId} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="glass-card-heavy sm:max-w-md border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Assign Technician</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select a technician to assign to this work order.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2 max-h-[320px] overflow-y-auto">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {technicians?.map((tech) => {
            const isSelected = selectedTechId === tech.id;
            const isBusy = tech.activeOrders >= 5;

            return (
              <button
                key={tech.id}
                type="button"
                disabled={isBusy}
                onClick={() => setSelectedTechId(isSelected ? null : tech.id)}
                className={`
                  w-full flex items-center justify-between p-4 rounded-xl text-left
                  transition-all duration-150
                  ${isSelected
                    ? 'bg-primary/10 border border-primary/30 shadow-sm'
                    : 'bg-card/40 border border-transparent hover:bg-card/70 hover:border-border'}
                  ${isBusy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{tech.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tech.activeOrders === 0
                      ? 'Available'
                      : `${tech.activeOrders} active job${tech.activeOrders > 1 ? 's' : ''}`}
                    {tech.currentOrderNumber && (
                      <span className="font-mono ml-1">
                        — {tech.currentOrderNumber}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {/* Workload indicator dots */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`size-1.5 rounded-full ${
                          i < tech.activeOrders
                            ? tech.activeOrders >= 4
                              ? 'bg-opsly-high'
                              : 'bg-primary'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>

                  {isSelected && (
                    <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}

          {technicians?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No active technicians found.
            </p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-opsly-urgent mt-2">
            Failed to assign technician. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!selectedTechId || mutation.isPending}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            {mutation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
