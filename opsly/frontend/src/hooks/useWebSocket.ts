import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { QUERY_KEYS } from '@/services/query-keys';
import type { WsEventName } from '@/types';

// Backend envelope shape: { event, timestamp, data }
interface WsEnvelope {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

// ─── Core WebSocket Hook ───────────────────────────────

export function useWebSocket() {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      console.warn('[WebSocket] No auth token available, skipping connection');
      return;
    }

    console.log('[WebSocket] Attempting to connect to', WS_URL);

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  const subscribe = useCallback(
    (event: string, handler: (payload: WsEnvelope) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      socket.on(event, handler);
      return () => { socket.off(event, handler); };
    },
    [],
  );

  return { socket: socketRef.current, isConnected, subscribe };
}

// ─── Dashboard Event Hook ──────────────────────────────
// Subscribes to all work order + escalation + metrics events
// and invalidates the relevant TanStack Query caches.

export function useDashboardEvents() {
  const { subscribe, isConnected } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected) return;

    const events: WsEventName[] = [
      'workorder.created',
      'workorder.status_changed',
      'workorder.technician_assigned',
      'workorder.photo_assessed',
      'workorder.completed',
      'workorder.eta_updated',
      'escalation.triggered',
      'escalation.acknowledged',
      'metrics.snapshot_updated',
    ];

    const unsubscribers = events.map((event) =>
      subscribe(event, () => {
        // Invalidate work order list + metrics + schedules on any work order event
        if (event.startsWith('workorder.')) {
          queryClient.invalidateQueries({ queryKey: ['work-orders'] });
          queryClient.invalidateQueries({ queryKey: ['schedules'] });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics() });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.technicians() });
        }

        // Invalidate escalations on escalation events
        if (event.startsWith('escalation.')) {
          queryClient.invalidateQueries({ queryKey: ['escalations'] });
          queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        }

        // Invalidate metrics on snapshot update
        if (event === 'metrics.snapshot_updated') {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics() });
        }
      }),
    );

    return () => { unsubscribers.forEach((unsub) => unsub()); };
  }, [isConnected, subscribe, queryClient]);

  return { isConnected };
}

// ─── Single Work Order Event Hook ──────────────────────
// For the detail panel — listens for updates to a specific work order.

export function useWorkOrderEvents(
  workOrderId: string | null,
  onUpdate?: (data: Record<string, unknown>) => void,
) {
  const { subscribe, isConnected, socket } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected || !workOrderId || !socket) return;

    // Join the specific work order room
    socket.emit('joinWorkOrder', workOrderId);

    const events: WsEventName[] = [
      'workorder.status_changed',
      'workorder.technician_assigned',
      'workorder.photo_assessed',
      'workorder.completed',
      'workorder.eta_updated',
    ];

    const unsubscribers = events.map((event) =>
      subscribe(event, (payload: WsEnvelope) => {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.workOrder(workOrderId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.workOrderEvents(workOrderId),
        });
        onUpdate?.(payload.data);
      }),
    );

    return () => {
      socket.emit('leaveWorkOrder', workOrderId);
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isConnected, workOrderId, subscribe, socket, queryClient, onUpdate]);
}
