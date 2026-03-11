import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatThreads } from '@/hooks/useChatThreads';
import { useAuth } from '@/hooks/useAuth';
import type { ChatThread } from '@/types';

const ROLE_COLORS: Record<string, string> = {
  TENANT: 'bg-primary/10 text-primary',
  TECHNICIAN: 'bg-emerald-500/10 text-emerald-500',
  MANAGER: 'bg-amber-500/10 text-amber-500',
  ADMIN: 'bg-purple-500/10 text-purple-500',
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function ThreadItem({
  thread,
  currentUserId,
  onSelect,
}: {
  thread: ChatThread;
  currentUserId: string;
  onSelect: (workOrderId: string) => void;
}) {
  const msg = thread.lastMessage;
  if (!msg) return null;

  const isFromOther = msg.senderId !== currentUserId;
  const senderColor = ROLE_COLORS[msg.sender.role] ?? ROLE_COLORS.TENANT;

  return (
    <button
      onClick={() => onSelect(thread.workOrderId)}
      className={`w-full text-left px-5 py-3.5 flex gap-3 items-start transition-colors hover:bg-accent/40 ${
        isFromOther ? 'bg-primary/[0.03]' : ''
      }`}
    >
      {/* Avatar circle */}
      <div
        className={`size-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${senderColor}`}
      >
        {msg.sender.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="font-mono text-xs font-bold text-foreground truncate">
            {thread.orderNumber}
          </span>
          <span className="text-[10px] text-foreground/50 shrink-0 font-mono font-medium">
            {timeAgo(msg.createdAt)}
          </span>
        </div>
        <p className="text-[11px] font-medium text-foreground/60 truncate mb-0.5">
          {msg.sender.name} &middot;{' '}
          <span className="capitalize">{msg.sender.role.toLowerCase()}</span>
        </p>
        <p className="text-xs text-secondary-foreground truncate">
          {msg.content}
        </p>
      </div>

      {/* Unread indicator for messages from others */}
      {isFromOther && (
        <div className="size-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </button>
  );
}

export function ChatNotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { threads, isLoading } = useChatThreads();

  // Count threads where last message is from someone else
  const unreadCount = threads.filter(
    (t) => t.lastMessage && t.lastMessage.senderId !== user?.id,
  ).length;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSelectThread(workOrderId: string) {
    setOpen(false);
    navigate(`/tenant/orders?chat=${workOrderId}`);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative flex items-center justify-center size-9 rounded-xl hover:bg-accent/60 transition-colors"
        aria-label="Chat messages"
      >
        <svg
          className="size-[18px] text-foreground/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-[18px] rounded-full bg-opsly-urgent text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] glass-card-heavy rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
            <h3 className="text-sm font-bold text-foreground">Messages</h3>
            {threads.length > 0 && (
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/tenant/orders');
                }}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all
              </button>
            )}
          </div>

          {/* Thread list */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted/20 animate-pulse" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center">
                <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="size-5 text-muted-foreground/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-foreground/60">No messages yet</p>
                <p className="text-xs font-medium text-foreground/50 mt-1">
                  Chat will appear here when a technician messages you
                </p>
              </div>
            ) : (
              threads.map((thread) => (
                <ThreadItem
                  key={thread.workOrderId}
                  thread={thread}
                  currentUserId={user?.id ?? ''}
                  onSelect={handleSelectThread}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
