/**
 * OPTION B — Voice Hero
 *
 * Changes from current design:
 * - Left: Slimmed to unit strip + AI Insights only (no quick actions)
 * - Center: 2x2 large action tile grid sits ABOVE the voice widget
 *   giving tenants a visual "choose your category" before speaking
 * - Center: Voice widget is smaller (not full height), below the tiles
 * - Right: Order cards show 5-step progress bar + technician ETA card
 */

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUnitByTenant, getWorkOrders, getTenantInsights, getSessionRecap } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import VoiceWidget from '@/components/voice/VoiceWidget';
import NotificationToasts from '@/components/tenant/NotificationToasts';
import { ChatNotificationDropdown } from '@/components/chat/ChatNotificationDropdown';
import type { WorkOrderListItem } from '@/types';
import { timeAgo } from '@/lib/time';

/* ── Helpers ─────────────────────────────────────────────── */

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

/* ── 2x2 Hero Action Tiles ───────────────────────────────── */

const HERO_TILES = [
  {
    label: 'Leak or flooding',
    message: 'I have a water or plumbing issue',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    border: 'border-blue-500/20',
  },
  {
    label: 'Something broken',
    message: 'I have a repair issue I need help with',
    icon: 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
    color: 'text-slate-500',
    bg: 'bg-slate-500/10 hover:bg-slate-500/20',
    border: 'border-slate-500/20',
  },
  {
    label: 'No power / electrical',
    message: 'I have an electrical problem',
    icon: 'M7 2v11h3v9l7-12h-4l4-8z',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    border: 'border-amber-500/20',
  },
  {
    label: 'Where\'s my technician?',
    message: 'Where is my technician and when will they arrive?',
    icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    border: 'border-emerald-500/20',
  },
];

/* ── Step progress bar ───────────────────────────────────── */

function StepBar({ status }: { status: string }) {
  const current = stepIndex(status);
  return (
    <div className="flex items-center gap-0.5 mt-2.5">
      {STATUS_STEPS.map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full ${i < current ? 'bg-opsly-low' : i === current ? 'bg-primary' : 'bg-border'}`} />
      ))}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function TenantReportPageB() {
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

  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isConnected) return;
    const unsubs = [
      subscribe('workorder.eta_updated', (payload: { data: Record<string, unknown> }) => {
        const woId = payload.data.workOrderId as string;
        const eta = payload.data.eta as string;
        if (woId && eta) setEtaMap((prev) => ({ ...prev, [woId]: eta }));
      }),
      ...['workorder.status_changed', 'workorder.completed', 'workorder.technician_assigned'].map(
        (evt) => subscribe(evt, () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workOrders() });
        }),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [isConnected, subscribe, queryClient]);

  const activeRecap = !recapDismissed && recapData?.recap ? recapData as { recap: string; sessionAge: string } : null;
  const activeOrders = orders?.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED') ?? [];

  return (
    <main className="flex min-h-screen flex-col">
      <NotificationToasts />

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-30 px-3 sm:px-6 h-14 sm:h-16 w-full">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-8 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight select-none shrink-0">OPSLY</h1>
            <div className="flex items-center gap-1">
              <Link to="/tenant/report-b" className={location.pathname === '/tenant/report-b' ? 'pill-active text-xs' : 'pill-inactive text-xs'}>Report Issue</Link>
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

        {/* ── LEFT: Unit + AI Insights (slim) ─────────── */}
        <aside className="hidden lg:flex w-[260px] xl:w-[280px] shrink-0 flex-col gap-3 sticky top-24">

          {/* Compact unit card */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-lg leading-none">{unit?.unitNumber ?? '...'}</p>
                <p className="text-xs text-muted-foreground">{unit?.property?.name ?? '...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border/50 pt-3">
              {unit?.floor != null && <span className="flex items-center gap-1"><svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M4 18V9l8-6 8 6v9" strokeLinecap="round" strokeLinejoin="round"/></svg>Floor {unit.floor}</span>}
              <span className="flex items-center gap-1"><svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>{user?.name}</span>
            </div>
          </div>

          {/* AI Insights */}
          {insightsSummary && (
            <div className="glass-card p-5" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="size-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" /></svg>
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary">AI Insights</p>
              </div>
              <p className="text-xs text-secondary-foreground leading-relaxed">{insightsSummary}</p>
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <svg className="size-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z" /></svg>
                Powered by Gemini
              </p>
            </div>
          )}
        </aside>

        {/* ── CENTER: Action tiles + Voice Widget ──────── */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-3" style={{ height: 'calc(100vh - 7rem)' }}>

          {/* 2x2 Hero action tiles */}
          <div className="glass-card p-4 shrink-0">
            <p className="text-xs font-semibold text-muted-foreground mb-3">What's happening in your unit?</p>
            <div className="grid grid-cols-2 gap-2">
              {HERO_TILES.map((tile) => (
                <button
                  key={tile.label}
                  onClick={() => sendToChat.current(tile.message)}
                  className={`flex items-center gap-2.5 rounded-xl border ${tile.border} ${tile.bg} px-3 py-3 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <span className={`size-8 rounded-lg bg-white/50 dark:bg-white/5 flex items-center justify-center shrink-0`}>
                    <svg className={`size-4 ${tile.color}`} viewBox="0 0 24 24" fill="currentColor"><path d={tile.icon} /></svg>
                  </span>
                  <span className="text-sm font-medium text-secondary-foreground leading-snug">{tile.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 shrink-0 px-1">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground">or speak freely</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

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

        {/* ── RIGHT: Orders with step progress ─────────── */}
        <aside className="hidden xl:flex w-[320px] xl:w-[340px] shrink-0 flex-col gap-3 sticky top-24">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">My Open Orders</p>
            <Link to="/tenant/orders" className="text-xs text-primary hover:underline font-medium">View all</Link>
          </div>

          {activeOrders.length === 0 && (
            <div className="glass-card p-6 text-center"><p className="text-sm text-muted-foreground">No open requests</p></div>
          )}

          {activeOrders.slice(0, 3).map((order) => (
            <div key={order.id} className={`glass-card p-4 border-l-[3px] ${priorityBorderClass(order.priority)} hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold">{order.orderNumber}</span>
                <PriorityBadge priority={order.priority} />
              </div>
              <p className="text-sm text-secondary-foreground line-clamp-2 mb-2 leading-relaxed">{order.issueDescription}</p>
              <div className="flex items-center justify-between">
                <StatusBadge status={order.status} />
                <span className="text-[10px] text-muted-foreground font-mono">{timeAgo(order.createdAt)}</span>
              </div>
              {/* Step progress bar */}
              <StepBar status={order.status} />
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
            </div>
          ))}

          <div className="glass-card p-4 border-l-[3px] border-l-opsly-urgent">
            <p className="text-sm font-semibold text-opsly-urgent mb-0.5">Emergency?</p>
            <p className="text-sm text-secondary-foreground">Call: <span className="font-mono font-bold text-primary">(555) 911-2847</span></p>
          </div>
        </aside>
      </section>
    </main>
  );
}
