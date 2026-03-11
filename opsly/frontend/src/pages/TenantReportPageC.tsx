/**
 * OPTION C — Status Dashboard
 *
 * Changes from current design:
 * - Left: Compact unit strip + AI Insights + quick action links
 * - Center: Split vertically — TOP half shows the most urgent active order
 *   as a spotlight card with full progress timeline; BOTTOM half is voice widget
 * - Right: Full order list with expanded timeline + live feed
 *
 * The key bet: tenants with active orders care most about STATUS first,
 * then reporting. Surface that front and center.
 */

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUnitByTenant, getWorkOrders, getTenantInsights, getSessionRecap } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import VoiceWidget from '@/components/voice/VoiceWidget';
import NotificationToasts from '@/components/tenant/NotificationToasts';
import { ChatNotificationDropdown } from '@/components/chat/ChatNotificationDropdown';
import type { WorkOrderListItem } from '@/types';

/* ── Helpers ─────────────────────────────────────────────── */

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function priorityBorderClass(priority: string): string {
  switch (priority) {
    case 'URGENT': return 'border-l-opsly-urgent';
    case 'HIGH':   return 'border-l-opsly-high';
    case 'MEDIUM': return 'border-l-opsly-medium';
    case 'LOW':    return 'border-l-opsly-low';
    default:       return 'border-l-border';
  }
}

function statusUpdateText(order: WorkOrderListItem): string | null {
  if (order.status === 'EN_ROUTE' && order.assignedTo) return `${order.assignedTo.name} is en route`;
  if (order.status === 'ASSIGNED' && order.assignedTo) return `Technician assigned`;
  if (order.status === 'IN_PROGRESS') return 'Work in progress';
  if (order.status === 'REPORTED') return 'Awaiting triage';
  if (order.status === 'TRIAGED') return 'Scheduling soon';
  return null;
}

function statusDotColor(status: string): string {
  switch (status) {
    case 'EN_ROUTE': return 'bg-opsly-medium';
    case 'ASSIGNED': return 'bg-opsly-low';
    case 'IN_PROGRESS': return 'bg-opsly-high';
    default: return 'bg-muted-foreground';
  }
}

const STATUS_STEPS = ['REPORTED', 'TRIAGED', 'ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'] as const;
const STATUS_LABEL: Record<string, string> = {
  REPORTED: 'Reported', TRIAGED: 'Triaged', ASSIGNED: 'Assigned',
  EN_ROUTE: 'En Route', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
};

function stepIndex(status: string): number {
  return STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);
}

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/* ── Order Spotlight Card ────────────────────────────────── */

function OrderSpotlight({ order, eta }: { order: WorkOrderListItem; eta?: string }) {
  const current = stepIndex(order.status);
  const mins = eta ? Math.max(1, Math.round((new Date(eta).getTime() - Date.now()) / 60_000)) : null;

  return (
    <div className="glass-card-featured p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Active Issue</p>
          <p className="font-mono text-sm font-bold">{order.orderNumber}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PriorityBadge priority={order.priority} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-secondary-foreground leading-relaxed line-clamp-2">{order.issueDescription}</p>

      {/* Progress timeline */}
      <div className="flex items-center gap-1">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`size-2.5 rounded-full flex-shrink-0 ${
                i < current ? 'bg-opsly-low' :
                i === current ? 'bg-primary ring-2 ring-primary/30' :
                'bg-border'
              }`} />
              <p className={`text-[9px] mt-1 font-medium text-center leading-tight ${
                i === current ? 'text-primary' :
                i < current ? 'text-opsly-low' :
                'text-muted-foreground/40'
              }`}>
                {STATUS_LABEL[step]}
              </p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-px flex-1 mb-3 ${i < current ? 'bg-opsly-low/60' : 'bg-border/50'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ETA banner if en route */}
      {mins !== null && (
        <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2 text-sm text-primary font-medium">
          <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Technician arriving in ~{mins} minutes
        </div>
      )}

      {/* Tech info if assigned */}
      {order.assignedTo && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {order.assignedTo.name} assigned
        </p>
      )}
    </div>
  );
}

const QUICK_LINKS = [
  { label: 'Water / Plumbing', message: 'I have a water or plumbing issue' },
  { label: 'Electrical Problem', message: 'I have an electrical problem' },
  { label: 'Emergency / Urgent', message: 'I have an emergency maintenance issue' },
  { label: 'Check Order Status', message: 'Check order status' },
  { label: 'Other Issue', message: 'I have a maintenance issue to report' },
];

/* ── Main Page ────────────────────────────────────────────── */

export default function TenantReportPageC() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const sendToChat = useRef<(text: string) => void>(() => {});

  const { data: unit } = useQuery({
    queryKey: QUERY_KEYS.tenantUnit(user?.id ?? ''),
    queryFn: () => getUnitByTenant(user?.id ?? ''),
    enabled: !!user?.id,
  });

  const { data: orders } = useQuery<WorkOrderListItem[]>({
    queryKey: QUERY_KEYS.workOrders(),
    queryFn: () => getWorkOrders(),
    refetchInterval: false,
  });

  const { data: insightsSummary } = useQuery({
    queryKey: QUERY_KEYS.tenantInsights(),
    queryFn: getTenantInsights,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recapData } = useQuery({
    queryKey: QUERY_KEYS.sessionRecap(),
    queryFn: getSessionRecap,
    staleTime: 10 * 60 * 1000,
  });

  const [recapDismissed, setRecapDismissed] = useState(false);
  const [etaMap, setEtaMap] = useState<Record<string, string>>({});
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!orders) return;
    const apiEtas: Record<string, string> = {};
    for (const o of orders) { if (o.currentEta) apiEtas[o.id] = o.currentEta; }
    if (Object.keys(apiEtas).length > 0) setEtaMap((prev) => ({ ...apiEtas, ...prev }));
  }, [orders]);

  useEffect(() => {
    if (!isConnected) return;
    return subscribe('workorder.eta_updated', (payload: { data: Record<string, unknown> }) => {
      const woId = payload.data.workOrderId as string;
      const eta = payload.data.eta as string;
      if (woId && eta) setEtaMap((prev) => ({ ...prev, [woId]: eta }));
    });
  }, [isConnected, subscribe]);

  const activeRecap = !recapDismissed && recapData?.recap ? recapData as { recap: string; sessionAge: string } : null;
  const activeOrders = orders?.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED') ?? [];

  // Most urgent order for spotlight
  const spotlightOrder = [...activeOrders].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
  )[0];

  const liveUpdates = activeOrders
    .map((o) => ({ text: statusUpdateText(o), dot: statusDotColor(o.status), time: timeAgo(o.createdAt), id: o.id }))
    .filter((u) => u.text != null)
    .slice(0, 4);

  return (
    <main className="flex min-h-screen flex-col">
      <NotificationToasts />

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-30 px-3 sm:px-6 h-14 sm:h-16 w-full">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-8 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight select-none shrink-0">OPSLY</h1>
            <div className="flex items-center gap-1">
              <Link to="/tenant/report-c" className={location.pathname === '/tenant/report-c' ? 'pill-active text-xs' : 'pill-inactive text-xs'}>Report Issue</Link>
              <Link to="/tenant/orders" className="pill-inactive text-xs flex items-center gap-1.5">
                My Orders
                {activeOrders.length > 0 && <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">{activeOrders.length}</span>}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <ChatNotificationDropdown />
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <button onClick={logout} className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      {/* ── 3-Column Layout ─────────────────────────────── */}
      <section className="flex flex-1 items-start gap-4 sm:gap-6 p-3 sm:p-6 max-w-[1440px] mx-auto w-full">

        {/* ── LEFT: Unit + AI Insights + Quick Links ───── */}
        <aside className="hidden lg:flex w-[280px] xl:w-[300px] shrink-0 flex-col gap-3 sticky top-24">

          {/* Compact unit */}
          <div className="glass-card px-4 py-3 flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-none">{unit?.unitNumber ?? '...'} <span className="font-normal text-muted-foreground text-xs">· {unit?.property?.name ?? '...'}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.name} {unit?.floor != null ? `· Floor ${unit.floor}` : ''}</p>
            </div>
          </div>

          {/* AI Insights */}
          {insightsSummary && (
            <div className="glass-card p-4" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="size-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" /></svg>
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary">AI Insights</p>
              </div>
              <p className="text-xs text-secondary-foreground leading-relaxed">{insightsSummary}</p>
            </div>
          )}

          {/* Quick report links */}
          <div className="glass-card p-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Quick Report</p>
            <div className="space-y-0.5">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => sendToChat.current(link.message)}
                  className="w-full text-left text-sm text-secondary-foreground hover:text-primary hover:bg-primary/5 rounded-lg px-2 py-1.5 transition-colors flex items-center justify-between group"
                >
                  {link.label}
                  <svg className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CENTER: Spotlight + Voice Widget (split) ─── */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-3" style={{ height: 'calc(100vh - 7rem)' }}>

          {/* Order spotlight — most urgent active order */}
          {spotlightOrder ? (
            <div className="shrink-0">
              <OrderSpotlight order={spotlightOrder} eta={etaMap[spotlightOrder.id]} />
            </div>
          ) : (
            <div className="glass-card p-4 shrink-0 flex items-center gap-3">
              <div className="size-8 rounded-full bg-opsly-low/20 flex items-center justify-center">
                <svg className="size-4 text-opsly-low" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold">All clear</p>
                <p className="text-xs text-muted-foreground">No active maintenance requests</p>
              </div>
            </div>
          )}

          {/* Voice widget — takes remaining space */}
          <div className="glass-card-heavy overflow-hidden shadow-xl flex-1 min-h-0">
            <VoiceWidget
              userName={user?.name}
              onSendReady={(fn) => { sendToChat.current = fn; }}
              recap={activeRecap}
              onDismissRecap={() => setRecapDismissed(true)}
            />
          </div>
        </div>

        {/* ── RIGHT: Full order list + live feed ───────── */}
        <aside className="hidden xl:flex w-[320px] xl:w-[340px] shrink-0 flex-col gap-3 sticky top-24">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">My Open Orders</p>
            <Link to="/tenant/orders" className="text-xs text-primary hover:underline font-medium">View all</Link>
          </div>

          {activeOrders.length === 0 && (
            <div className="glass-card p-6 text-center"><p className="text-sm text-muted-foreground">No open requests</p></div>
          )}

          {activeOrders.slice(0, 4).map((order) => (
            <div key={order.id} className={`glass-card p-4 border-l-[3px] ${priorityBorderClass(order.priority)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold">{order.orderNumber}</span>
                <PriorityBadge priority={order.priority} />
              </div>
              <p className="text-xs text-secondary-foreground line-clamp-1 mb-1.5">{order.issueDescription}</p>
              <div className="flex items-center justify-between">
                <StatusBadge status={order.status} />
                <span className="text-[10px] text-muted-foreground font-mono">{timeAgo(order.createdAt)}</span>
              </div>
            </div>
          ))}

          {/* Live feed */}
          {liveUpdates.length > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Recent Updates</p>
                <span className="size-2 rounded-full bg-opsly-low animate-pulse" />
              </div>
              <div className="space-y-2.5">
                {liveUpdates.map((u, i) => (
                  <div key={i} className="flex gap-2.5 text-sm">
                    <span className={`size-2 rounded-full ${u.dot} mt-1.5 shrink-0`} />
                    <div>
                      <p className="text-secondary-foreground text-xs leading-relaxed">{u.text}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{u.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-4 border-l-[3px] border-l-opsly-urgent">
            <p className="text-sm font-semibold text-opsly-urgent mb-0.5">Emergency?</p>
            <p className="text-sm text-secondary-foreground">Call: <span className="font-mono font-bold text-primary">(555) 911-2847</span></p>
          </div>
        </aside>
      </section>
    </main>
  );
}
