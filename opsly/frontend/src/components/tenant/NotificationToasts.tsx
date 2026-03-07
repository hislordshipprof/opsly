import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';

interface Toast {
  id: string;
  message: string;
  accent: string;
  icon: string;
  timestamp: number;
}

/** Human-readable messages for WebSocket events */
function toastFromEvent(event: string, data: Record<string, unknown>): Omit<Toast, 'id' | 'timestamp'> | null {
  const orderNum = (data.orderNumber as string) || '';

  switch (event) {
    case 'workorder.created':
      return {
        message: `${orderNum} has been submitted — awaiting triage`,
        accent: 'border-l-primary',
        icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
      };
    case 'workorder.status_changed':
      return {
        message: `${orderNum} status updated to ${String(data.status ?? '').replace(/_/g, ' ')}`,
        accent: 'border-l-opsly-high',
        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      };
    case 'workorder.technician_assigned':
      return {
        message: `Technician assigned to ${orderNum}`,
        accent: 'border-l-primary',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      };
    case 'workorder.photo_assessed':
      return {
        message: `Photo assessed for ${orderNum}`,
        accent: 'border-l-opsly-medium',
        icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
      };
    case 'workorder.completed':
      return {
        message: `${orderNum} has been completed`,
        accent: 'border-l-opsly-low',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      };
    case 'escalation.triggered':
      return {
        message: `${orderNum} has been escalated — SLA breach`,
        accent: 'border-l-opsly-urgent',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      };
    default:
      return null;
  }
}

const TOAST_DURATION = 5000;

export default function NotificationToasts() {
  const { subscribe, isConnected } = useWebSocket();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { ...toast, id, timestamp: Date.now() }]);

    // Auto-dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const events = [
      'workorder.created',
      'workorder.status_changed',
      'workorder.technician_assigned',
      'workorder.photo_assessed',
      'workorder.completed',
      'escalation.triggered',
    ];

    const unsubscribers = events.map((event) =>
      subscribe(event, (payload: { event: string; data: Record<string, unknown> }) => {
        const toast = toastFromEvent(event, payload.data);
        if (toast) addToast(toast);

        // Invalidate tenant queries
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      }),
    );

    return () => { unsubscribers.forEach((unsub) => unsub()); };
  }, [isConnected, subscribe, addToast, queryClient]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 w-[320px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-card p-3 border-l-[3px] ${toast.accent} animate-in slide-in-from-right-5 fade-in duration-300 relative overflow-hidden`}
        >
          <div className="flex items-start gap-3">
            <svg className="size-4 text-muted-foreground shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={toast.icon} />
            </svg>
            <p className="text-xs text-secondary-foreground leading-relaxed flex-1">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss notification"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono mt-1 ml-7">just now</p>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/30">
            <div
              className="h-full bg-primary/40"
              style={{ animation: `shrink ${TOAST_DURATION}ms linear forwards` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
