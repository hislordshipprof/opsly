import { useState, useRef, useEffect } from 'react';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types';

interface ChatPanelProps {
  workOrderId: string;
}

const ROLE_COLORS: Record<Role, string> = {
  TENANT: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  TECHNICIAN: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  MANAGER: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

export function ChatPanel({ workOrderId }: ChatPanelProps) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, isSending } = useChatMessages(workOrderId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    sendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-foreground/60 font-medium text-sm">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-foreground/60 text-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>No messages yet</span>
            <span className="text-xs opacity-60">Start the conversation</span>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender.id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                isMe
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'glass-card rounded-bl-md'
              }`}>
                {!isMe && (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold">{msg.sender.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[msg.sender.role]}`}>
                      {msg.sender.role}
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <span className={`text-[10px] mt-1 block ${
                  isMe ? 'text-primary-foreground/60' : 'text-foreground/50'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isSending}
          className="flex-1 bg-transparent border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-foreground/40"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          aria-label="Send message"
          className="shrink-0 h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
