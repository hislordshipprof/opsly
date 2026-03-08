import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatThreads } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { useWebSocket } from './useWebSocket';
import type { ChatThread } from '@/types';

export function useChatThreads() {
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();

  const { data: threads = [], isLoading } = useQuery<ChatThread[]>({
    queryKey: QUERY_KEYS.chatThreads(),
    queryFn: getChatThreads,
    refetchInterval: false,
  });

  // Refresh thread list when any chat message arrives
  const handleMessage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatThreads() });
  }, [queryClient]);

  useEffect(() => {
    const unsub = subscribe('chat.message_sent', handleMessage);
    return unsub;
  }, [subscribe, handleMessage]);

  // Count threads with messages from others (simple "unread" proxy)
  const totalUnread = threads.filter(
    (t) => t.lastMessage && t.lastMessage.senderId !== undefined,
  ).length;

  return { threads, isLoading, totalUnread };
}
