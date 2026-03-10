import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getWorkOrders } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { SlaCountdown } from '@/components/dashboard/SlaCountdown';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ChatNotificationDropdown } from '@/components/chat/ChatNotificationDropdown';
import type { WorkOrderListItem } from '@/types';
function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── Work Order Card ─────────────────────────────────────── */

function WorkOrderCard({ order, autoOpenChat = false }: { order: WorkOrderListItem; autoOpenChat?: boolean }) {
  const [showChat, setShowChat] = useState(autoOpenChat);
  const hasTechnician = !!order.assignedTo;
  const etaMins = order.status === 'EN_ROUTE' && (order as any).currentEta
    ? Math.max(1, Math.round((new Date((order as any).currentEta).getTime() - Date.now()) / 60_000))
    : null;

  return (
    <div className="glass-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
            <PriorityBadge priority={order.priority} />
          </div>
          <SlaCountdown slaDeadline={order.slaDeadline} slaBreached={order.slaBreached} />
        </div>

        <p className="text-sm text-secondary-foreground leading-relaxed mb-3 line-clamp-2">
          {order.issueDescription}
        </p>

        {/* ETA banner when technician is en route */}
        {etaMins != null && (
          <div className="mb-3 flex items-center gap-1.5 text-primary text-xs font-medium bg-primary/10 rounded-lg px-2.5 py-1.5">
            <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Technician arriving in ~{etaMins} min
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Property
              </span>
              <span className="text-xs font-medium text-foreground mt-0.5">
                {order.property.name}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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
                onClick={() => setShowChat((p) => !p)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                  showChat
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-card/50 text-secondary-foreground hover:border-primary hover:text-primary'
                }`}
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
              </button>
            )}
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Reported
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5">
                {timeAgo(order.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Chat Panel */}
      {showChat && (
        <div className="h-[300px] border-t border-border/40">
          <ChatPanel workOrderId={order.id} />
        </div>
      )}
    </div>
  );
}

/* ── Empty State ────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="glass-card flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
      <div className="size-20 rounded-full bg-muted/40 flex items-center justify-center mb-5">
        <svg
          className="size-9 text-muted-foreground/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2">No work orders yet</h2>
      <p className="text-muted-foreground max-w-md leading-relaxed">
        You haven't reported any maintenance issues yet. Use the "Report Issue" tab to create your first work order.
      </p>
    </div>
  );
}

/* ── Loading Skeleton ───────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card h-32 animate-pulse" />
      ))}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function TenantOrdersPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatWorkOrderId = searchParams.get('chat');

  const { data: orders, isLoading } = useQuery<WorkOrderListItem[]>({
    queryKey: QUERY_KEYS.workOrders(),
    queryFn: () => getWorkOrders(),
    refetchInterval: false,
  });

  // Clear chat param after first render so it doesn't persist on refresh
  useEffect(() => {
    if (chatWorkOrderId) {
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen">
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
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-[1440px] mx-auto w-full px-3 sm:px-6 py-4 sm:py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">My Work Orders</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track the status of your maintenance requests
          </p>
        </div>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && orders && orders.length === 0 && <EmptyState />}

        {!isLoading && orders && orders.length > 0 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => (
              <WorkOrderCard key={order.id} order={order} autoOpenChat={order.id === chatWorkOrderId} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
