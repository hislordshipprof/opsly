import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatMessages, sendChatMessage } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { useWebSocket } from './useWebSocket';
import type { ChatMessage } from '@/types';

export function useChatMessages(workOrderId: string) {
  const queryClient = useQueryClient();
  const { subscribe, isConnected, socket } = useWebSocket();

  const query = useQuery({
    queryKey: QUERY_KEYS.chatMessages(workOrderId),
    queryFn: () => getChatMessages(workOrderId),
    enabled: !!workOrderId,
  });

  const mutation = useMutation({
    mutationFn: (content: string) => sendChatMessage(workOrderId, content),
    onSuccess: (newMsg) => {
      // Append only if WebSocket hasn't already delivered it
      queryClient.setQueryData<ChatMessage[]>(
        QUERY_KEYS.chatMessages(workOrderId),
        (old) => {
          if (!old) return [newMsg];
          if (old.some((m) => m.id === newMsg.id)) return old;
          return [...old, newMsg];
        },
      );
    },
  });

  // Listen for incoming chat messages via WebSocket
  useEffect(() => {
    if (!isConnected || !socket) return;

    // Join the work order room for chat events
    socket.emit('joinWorkOrder', workOrderId);

    const unsub = subscribe('chat.message_sent', (payload) => {
      const msg = payload.data as unknown as ChatMessage;
      // Only append if not already in cache (avoid duplicating our own messages)
      queryClient.setQueryData<ChatMessage[]>(
        QUERY_KEYS.chatMessages(workOrderId),
        (old) => {
          if (!old) return [msg];
          if (old.some((m) => m.id === msg.id)) return old;
          return [...old, msg];
        },
      );
    });

    return () => {
      socket.emit('leaveWorkOrder', workOrderId);
      unsub();
    };
  }, [isConnected, socket, workOrderId, subscribe, queryClient]);

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    sendMessage: mutation.mutate,
    isSending: mutation.isPending,
  };
}
