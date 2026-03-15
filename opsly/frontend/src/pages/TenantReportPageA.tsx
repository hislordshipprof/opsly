/**
 * OPTION A — Polish & Tighten
 *
 * Changes from current design:
 * - Left: AI Insights moved to TOP (most valuable content first)
 * - Left: Unit card is compact horizontal strip (no large home icon)
 * - Left: Quick actions use full-width rows with trailing chevron
 * - Center: VoiceWidget unchanged (same hero role)
 * - Right: Stats bar at top showing urgent/active counts
 * - Right: Order cards have mini step-progress dots for status clarity
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

const STATUS_STEPS = ['REPORTED', 'TRIAGED', 'ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'] as const;

function stepIndex(status: string): number {
  return STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);
}

const QUICK_ACTIONS = [
  { label: 'Water / Plumbing Issue', message: 'I have a water or plumbing issue', iconColor: 'text-blue-500', bg: 'bg-blue-500/10', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z' },
  { label: 'Electrical Problem',       message: 'I have an electrical problem',         iconColor: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'M7 2v11h3v9l7-12h-4l4-8z' },
  { label: 'Emergency / Urgent',       message: 'I have an emergency maintenance issue', iconColor: 'text-red-500',  bg: 'bg-red-500/10',  icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
  { label: 'Check Order Status',       message: 'Check order status',                   iconColor: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z' },
  { label: 'Other Issue',              message: 'I have a maintenance issue to report',  iconColor: 'text-muted-foreground', bg: 'bg-muted/40', icon: 'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' },
];

/* ── Mini step dots ──────────────────────────────────────── */

function StepDots({ status }: { status: string }) {
  const current = stepIndex(status);
  return (
    <div className="flex items-center gap-1 mt-2">
      {STATUS_STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < current ? 'bg-opsly-low' :
            i === current ? 'bg-primary' :
            'bg-border'
          }`}
        />
      ))}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function TenantReportPageA() {
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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
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

  const activeRecap = !recapDismissed && recapData?.recap
    ? recapData as { recap: string; sessionAge: string }
    : null;

  const activeOrders = orders?.filter(
    (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED',
  ) ?? [];

  const urgentCount = activeOrders.filter((o) => o.priority === 'URGENT').length;
  const inProgressCount = activeOrders.filter((o) => ['IN_PROGRESS', 'EN_ROUTE', 'ASSIGNED'].includes(o.status)).length;

  return (
    <main className="flex min-h-screen flex-col">
      <NotificationToasts />

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-30 px-3 sm:px-6 h-14 sm:h-16 w-full">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-8 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight select-none shrink-0">OPSLY</h1>
            <div className="flex items-center gap-1">
              <Link to="/tenant/report-a" className={location.pathname === '/tenant/report-a' ? 'pill-active text-xs' : 'pill-inactive text-xs'}>Report Issue</Link>
              <Link to="/tenant/orders" className="pill-inactive text-xs flex items-center gap-1.5">
                My Orders
                {activeOrders.length > 0 && (
                  <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">{activeOrders.length}</span>
                )}
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

        {/* ── LEFT: AI Insights → Unit strip → Quick actions ── */}
        <aside className="hidden lg:flex w-[300px] xl:w-[320px] shrink-0 flex-col gap-3 sticky top-24">

          {/* AI Insights — MOVED TO TOP */}
          {insightsSummary && (
            <div className="glass-card p-4" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="size-3.5 text-primary shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
                </svg>
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary">AI Insights</p>
              </div>
              <p className="text-xs text-secondary-foreground leading-relaxed line-clamp-4">{insightsSummary}</p>
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <svg className="size-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z" /></svg>
                Powered by Gemini
              </p>
            </div>
          )}

          {/* Unit info — compact horizontal strip */}
          <div className="glass-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-none">{unit?.unitNumber ?? '...'} <span className="font-normal text-muted-foreground">·</span> <span className="font-normal text-muted-foreground text-xs">{unit?.property?.name ?? '...'}</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unit?.floor != null ? `Floor ${unit.floor} · ` : ''}{user?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Report — full-width rows with chevron */}
          <div className="glass-card overflow-hidden">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-4 pt-4 pb-2">Quick Report</p>
            <div className="divide-y divide-border/40">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendToChat.current(action.message)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-accent/50 transition-colors text-left group"
                >
                  <span className={`size-7 rounded-lg ${action.bg} flex items-center justify-center shrink-0`}>
                    <svg className={`size-3.5 ${action.iconColor}`} viewBox="0 0 24 24" fill="currentColor"><path d={action.icon} /></svg>
                  </span>
                  <span className="flex-1 min-w-0 truncate">{action.label}</span>
                  <svg className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CENTER: Voice Widget ──────────────────────── */}
        <div className="flex-1 min-w-0 w-full">
          <div className="h-[calc(100vh-7rem)] glass-card-heavy overflow-hidden shadow-2xl">
            <VoiceWidget
              userName={user?.name}
              onSendReady={(fn) => { sendToChat.current = fn; }}
              recap={activeRecap}
              onDismissRecap={() => setRecapDismissed(true)}
            />
          </div>
        </div>

        {/* ── RIGHT: Stats + Orders + Updates ──────────── */}
        <aside className="hidden xl:flex w-[320px] xl:w-[340px] shrink-0 flex-col gap-3 sticky top-24">

          {/* Stats strip */}
          <div className="glass-strip px-4 py-2.5 flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-opsly-urgent">
              <span className="size-2 rounded-full bg-opsly-urgent" />
              {urgentCount} Urgent
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-opsly-medium">
              <span className="size-2 rounded-full bg-opsly-medium" />
              {inProgressCount} Active
            </span>
            <Link to="/tenant/orders" className="ml-auto text-xs text-primary hover:underline font-medium shrink-0">View all</Link>
          </div>

          {/* Order cards with step dots */}
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-1">My Open Orders</p>

          {activeOrders.length === 0 && (
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-muted-foreground">No open requests</p>
            </div>
          )}

          {activeOrders.slice(0, 3).map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div key={order.id} className={`glass-card border-l-[3px] ${priorityBorderClass(order.priority)} hover:shadow-lg transition-all duration-200`}>
                <button onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="w-full text-left p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold">{order.orderNumber}</span>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={order.priority} />
                      <svg className={`size-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-secondary-foreground line-clamp-2 mb-2 leading-relaxed">{order.issueDescription}</p>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={order.status} />
                    <span className="text-[10px] text-muted-foreground font-mono">{timeAgo(order.createdAt)}</span>
                  </div>
                  {/* Step progress dots */}
                  <StepDots status={order.status} />
                  {/* ETA */}
                  {order.status === 'EN_ROUTE' && etaMap[order.id] && (() => {
                    const mins = Math.max(1, Math.round((new Date(etaMap[order.id]).getTime() - Date.now()) / 60_000));
                    return (
                      <div className="mt-2 flex items-center gap-1.5 text-primary text-[11px] font-medium bg-primary/10 rounded-lg px-2.5 py-1.5">
                        <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Technician arriving in ~{mins} min
                      </div>
                    );
                  })()}
                </button>
              </div>
            );
          })}

          {/* Emergency */}
          <div className="glass-card p-4 border-l-[3px] border-l-opsly-urgent">
            <p className="text-sm font-semibold text-opsly-urgent mb-0.5">Emergency?</p>
            <p className="text-sm text-secondary-foreground">Call: <span className="font-mono font-bold text-primary">(555) 911-2847</span></p>
          </div>
        </aside>
      </section>
    </main>
  );
}
