import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWorkOrders } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { SlaCountdown } from '@/components/dashboard/SlaCountdown';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ChatNotificationDropdown } from '@/components/chat/ChatNotificationDropdown';
import { WorkOrderStatus, Priority } from '@/types';
import type { WorkOrderListItem } from '@/types';
import { timeAgo } from '@/lib/time';

/* ── Utilities ─────────────────────────────────────────── */

function getPriorityBorderColor(order: WorkOrderListItem): string {
  if (order.status === 'ESCALATED') return 'border-l-opsly-urgent';
  switch (order.priority) {
    case 'URGENT': return 'border-l-opsly-urgent';
    case 'HIGH':   return 'border-l-opsly-high';
    case 'MEDIUM': return 'border-l-opsly-medium';
    default:       return 'border-l-transparent';
  }
}

/* ── Work Order Card ───────────────────────────────────── */

function WorkOrderCard({ order, onOpenChat }: { order: WorkOrderListItem; onOpenChat: (id: string) => void }) {
  const hasTechnician = !!order.assignedTo;
  const borderColor = getPriorityBorderColor(order);
  const etaMins = order.status === 'EN_ROUTE' && (order as any).currentEta
    ? Math.max(1, Math.round((new Date((order as any).currentEta).getTime() - Date.now()) / 60_000))
    : null;

  return (
    <div
      className={`glass-card overflow-hidden border-l-4 ${borderColor} hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col`}
      style={{ border: '1px solid rgba(0,0,0,0.12)', borderLeftWidth: '4px' }}
    >
      <div className="p-5 flex flex-col flex-1">
        {/* Header: WO number + badges */}
        <div className="flex items-start justify-between mb-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/70 font-bold">
            {order.orderNumber}
          </span>
          <SlaCountdown slaDeadline={order.slaDeadline} slaBreached={order.slaBreached} />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={order.status} />
          <PriorityBadge priority={order.priority} />
        </div>

        {/* ETA banner */}
        {etaMins != null && (
          <div className="mb-3 flex items-center gap-1.5 text-primary text-xs font-medium bg-primary/10 rounded-lg px-2.5 py-1.5">
            <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Technician arriving in ~{etaMins} min
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-secondary-foreground leading-relaxed line-clamp-3 flex-1 mb-4">
          {order.issueDescription}
        </p>

        {/* Footer */}
        <div className="flex items-end justify-between pt-3 border-t border-border/30 mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                Property
              </span>
              <span className="text-xs font-medium text-foreground mt-0.5">
                {order.property.name}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                Unit
              </span>
              <span className="text-xs font-medium text-foreground mt-0.5">
                {order.unit.unitNumber}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasTechnician && (
              <button
                onClick={() => onOpenChat(order.id)}
                className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-3 py-1.5 font-bold text-xs hover:bg-primary/20 transition-colors"
                aria-label={`Open chat for ${order.orderNumber}`}
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
              </button>
            )}
            <div className="text-right">
              <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                Reported
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5">
                {timeAgo(order.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Chat Sidebar ──────────────────────────────────────── */

function ChatSidebar({ workOrderId, orderNumber, onClose }: {
  workOrderId: string;
  orderNumber: string;
  onClose: () => void;
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sidebar panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md glass-card-heavy z-50 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <svg className="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm">{orderNumber}</h3>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-opsly-low animate-pulse" />
              <span className="text-[11px] font-medium text-foreground/60">AI Assistant Active</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
            aria-label="Close chat sidebar"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Chat body */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel workOrderId={workOrderId} />
        </div>
      </div>
    </>
  );
}

/* ── Empty State ───────────────────────────────────────── */

function EmptyState({ isSearchResult }: { isSearchResult?: boolean }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center text-center p-12 min-h-[400px]"
      style={{ border: '1px solid rgba(0,0,0,0.12)' }}
    >
      <div className="size-20 rounded-full bg-muted/40 flex items-center justify-center mb-5">
        <svg
          className="size-9 text-muted-foreground/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          {isSearchResult ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
            />
          )}
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2">
        {isSearchResult ? 'No matching orders' : 'No work orders yet'}
      </h2>
      <p className="text-foreground/60 font-medium max-w-md leading-relaxed">
        {isSearchResult
          ? 'Try adjusting your search terms or clearing the filter.'
          : 'You haven\'t reported any maintenance issues yet. Use the "Report Issue" tab to create your first work order.'}
      </p>
    </div>
  );
}

/* ── Loading Skeleton ──────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card h-52 animate-pulse" style={{ border: '1px solid rgba(0,0,0,0.12)' }} />
      ))}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */

export default function TenantOrdersPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatWorkOrderId = searchParams.get('chat');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatOrderId, setSelectedChatOrderId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [priorityFilters, setPriorityFilters] = useState<Set<string>>(new Set());

  const { data: orders, isLoading } = useQuery<WorkOrderListItem[]>({
    queryKey: QUERY_KEYS.workOrders(),
    queryFn: () => getWorkOrders(),
    refetchInterval: false,
  });

  // Real-time: invalidate work orders cache on status/assignment changes
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;
    const events = [
      'workorder.status_changed',
      'workorder.completed',
      'workorder.technician_assigned',
      'workorder.created',
    ] as const;
    const unsubs = events.map((evt) =>
      subscribe(evt, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workOrders() });
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [isConnected, subscribe, queryClient]);

  // Deep-link: auto-open chat sidebar from ?chat= param
  useEffect(() => {
    if (chatWorkOrderId) {
      setSelectedChatOrderId(chatWorkOrderId);
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilterCount = statusFilters.size + priorityFilters.size;

  function toggleFilter(_set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setFn(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }

  function clearAllFilters() {
    setStatusFilters(new Set());
    setPriorityFilters(new Set());
    setSearchQuery('');
  }

  // Client-side search + filter
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      if (statusFilters.size > 0 && !statusFilters.has(o.status)) return false;
      if (priorityFilters.size > 0 && !priorityFilters.has(o.priority)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!o.orderNumber.toLowerCase().includes(q) && !o.issueDescription.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilters, priorityFilters]);

  // Find the selected order for sidebar header
  const selectedOrder = orders?.find(o => o.id === selectedChatOrderId);

  return (
    <main className="min-h-screen bg-role-tenant">
      {/* Nav header */}
      <header className="glass-nav sticky top-0 z-30 px-3 sm:px-6 h-14 sm:h-16 w-full">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-8 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight select-none shrink-0">OPSLY</h1>
            <div className="flex items-center gap-1">
              <Link
                to="/tenant/report"
                className={location.pathname === '/tenant/report' ? 'pill-active text-xs' : 'pill-inactive text-xs'}
              >
                Report Issue
              </Link>
              <Link
                to="/tenant/orders"
                className={location.pathname === '/tenant/orders' ? 'pill-active text-xs' : 'pill-inactive text-xs'}
              >
                My Orders
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <ChatNotificationDropdown />
            <span className="text-sm font-medium text-foreground/60 hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-xs sm:text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Controls bar */}
      <div className="glass-strip border-b border-border/30 px-3 sm:px-6 py-5" style={{ borderRadius: 0 }}>
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground drop-shadow-sm">Order History</h2>
            <p className="text-sm font-medium text-foreground/70 mt-0.5">
              Track and manage your maintenance requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative hidden sm:block">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="bg-background/60 border border-border rounded-xl pl-9 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`border rounded-xl px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                showFilters || activeFilterCount > 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background/60 hover:bg-muted/50'
              }`}
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="size-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="glass-strip border-b border-border/30 px-3 sm:px-6 py-4 animate-in fade-in duration-200" style={{ borderRadius: 0 }}>
          <div className="max-w-[1440px] mx-auto space-y-3">
            {/* Status row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider w-16 shrink-0">Status</span>
              {Object.values(WorkOrderStatus).map(s => (
                <button
                  key={s}
                  onClick={() => toggleFilter(statusFilters, setStatusFilters, s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilters.has(s)
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-background/60 text-secondary-foreground hover:border-primary/40'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {/* Priority row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider w-16 shrink-0">Priority</span>
              {Object.values(Priority).map(p => (
                <button
                  key={p}
                  onClick={() => toggleFilter(priorityFilters, setPriorityFilters, p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    priorityFilters.has(p)
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-background/60 text-secondary-foreground hover:border-primary/40'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {/* Clear all */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium text-foreground/60 hover:text-foreground transition-colors underline underline-offset-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content grid */}
      <section className="max-w-[1440px] mx-auto w-full px-3 sm:px-6 py-6">
        {isLoading && <LoadingSkeleton />}

        {!isLoading && orders && orders.length === 0 && <EmptyState />}

        {!isLoading && orders && orders.length > 0 && filteredOrders.length === 0 && (
          <EmptyState isSearchResult />
        )}

        {!isLoading && filteredOrders.length > 0 && (
          <>
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredOrders.map((order) => (
                <WorkOrderCard
                  key={order.id}
                  order={order}
                  onOpenChat={(id) => setSelectedChatOrderId(id)}
                />
              ))}
            </div>

            {/* Load more placeholder */}
            {filteredOrders.length >= 12 && (
              <div className="flex justify-center mt-8">
                <button className="pill-inactive text-sm font-medium px-6 py-2">
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Chat sidebar overlay */}
      {selectedChatOrderId && selectedOrder && (
        <ChatSidebar
          workOrderId={selectedChatOrderId}
          orderNumber={selectedOrder.orderNumber}
          onClose={() => setSelectedChatOrderId(null)}
        />
      )}
    </main>
  );
}
