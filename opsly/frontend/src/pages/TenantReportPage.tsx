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

/* ── Helpers ────────────────────────────────────────────── */


function statusUpdateText(order: WorkOrderListItem): string | null {
  if (order.status === 'EN_ROUTE' && order.assignedTo)
    return `${order.assignedTo.name} is en route for ${order.orderNumber}`;
  if (order.status === 'ASSIGNED' && order.assignedTo)
    return `${order.assignedTo.name} assigned to ${order.orderNumber}`;
  if (order.status === 'IN_PROGRESS')
    return `Work in progress on ${order.orderNumber}`;
  if (order.status === 'REPORTED')
    return `${order.orderNumber} submitted — awaiting triage`;
  if (order.status === 'TRIAGED')
    return `${order.orderNumber} triaged — scheduling soon`;
  return null;
}

function statusDotColor(status: string): string {
  switch (status) {
    case 'EN_ROUTE': return 'bg-opsly-medium';
    case 'ASSIGNED': return 'bg-opsly-low';
    case 'IN_PROGRESS': return 'bg-opsly-high';
    case 'REPORTED': return 'bg-muted-foreground';
    case 'TRIAGED': return 'bg-opsly-sky';
    default: return 'bg-muted-foreground';
  }
}

/* ── Order timeline steps ─────────────────────────────── */

const STATUS_STEPS = ['REPORTED', 'TRIAGED', 'ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'] as const;

const STATUS_LABEL: Record<string, string> = {
  REPORTED: 'Reported', TRIAGED: 'Triaged', ASSIGNED: 'Assigned',
  EN_ROUTE: 'En Route', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
  ESCALATED: 'Escalated', NEEDS_PARTS: 'Needs Parts', CANCELLED: 'Cancelled',
};

function getStepState(stepStatus: string, orderStatus: string): 'done' | 'current' | 'future' {
  const stepIdx = STATUS_STEPS.indexOf(stepStatus as typeof STATUS_STEPS[number]);
  const orderIdx = STATUS_STEPS.indexOf(orderStatus as typeof STATUS_STEPS[number]);
  // For non-standard statuses (ESCALATED, etc.), show as current
  if (orderIdx === -1) return stepStatus === orderStatus ? 'current' : 'future';
  if (stepIdx < orderIdx) return 'done';
  if (stepIdx === orderIdx) return 'current';
  return 'future';
}

/* ── Quick action definitions ───────────────────────────── */

const QUICK_ACTIONS = [
  { label: 'Water / Plumbing Issue', message: 'I have a water or plumbing issue', color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z' },
  { label: 'Electrical Problem', message: 'I have an electrical problem', color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', icon: 'M7 2v11h3v9l7-12h-4l4-8z' },
  { label: 'Emergency / Urgent', message: 'I have an emergency maintenance issue', color: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
  { label: 'Check Order Status', message: 'Check order status', color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z' },
  { label: 'Other Issue', message: 'I have a maintenance issue to report', color: 'bg-gray-100 dark:bg-gray-800/50', iconColor: 'text-muted-foreground', icon: 'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' },
];

/* ── Main Page ──────────────────────────────────────────── */

export default function TenantReportPage() {
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
    staleTime: 5 * 60 * 1000, // Cache 5 min — AI call is expensive
  });

  const { data: recapData } = useQuery({
    queryKey: QUERY_KEYS.sessionRecap(),
    queryFn: getSessionRecap,
    staleTime: 10 * 60 * 1000,
  });

  const [recapDismissed, setRecapDismissed] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Track ETA per work order — seed from API, update via WebSocket
  const [etaMap, setEtaMap] = useState<Record<string, string>>({});
  const { subscribe, isConnected } = useWebSocket();

  // Seed etaMap from API response so ETA persists across page refreshes
  useEffect(() => {
    if (!orders) return;
    const apiEtas: Record<string, string> = {};
    for (const o of orders) {
      if (o.currentEta) apiEtas[o.id] = o.currentEta;
    }
    if (Object.keys(apiEtas).length > 0) {
      setEtaMap((prev) => ({ ...apiEtas, ...prev }));
    }
  }, [orders]);

  // Live updates from WebSocket
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isConnected) return;
    const unsubs = [
      subscribe('workorder.eta_updated', (payload: { data: Record<string, unknown> }) => {
        const woId = payload.data.workOrderId as string;
        const eta = payload.data.eta as string;
        if (woId && eta) setEtaMap((prev) => ({ ...prev, [woId]: eta }));
      }),
      // Invalidate work orders cache on status/assignment changes
      ...['workorder.status_changed', 'workorder.completed', 'workorder.technician_assigned'].map(
        (evt) => subscribe(evt, () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workOrders() });
        }),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [isConnected, subscribe, queryClient]);
  const activeRecap = !recapDismissed && recapData?.recap ? recapData as { recap: string; sessionAge: string } : null;

  const activeOrders = orders?.filter(
    (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED',
  ) ?? [];

  // Derive live updates from active orders
  const liveUpdates = activeOrders
    .map((o) => ({ text: statusUpdateText(o), dot: statusDotColor(o.status), time: timeAgo(o.createdAt), order: o }))
    .filter((u) => u.text != null)
    .slice(0, 4);

  return (
    <main className="flex h-screen flex-col lg:overflow-hidden overflow-y-auto bg-role-tenant">
      {/* ── Toast notifications from WebSocket events ──── */}
      <NotificationToasts />

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="glass-nav shrink-0 z-30 px-2 sm:px-6 h-14 sm:h-16 w-full">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-1 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <h1 className="text-sm sm:text-xl font-bold tracking-tight select-none shrink-0">OPSLY</h1>
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <Link
                to="/tenant/report"
                className={location.pathname === '/tenant/report' ? 'pill-active text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5' : 'pill-inactive text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5'}
              >
                Report
              </Link>
              <Link
                to="/tenant/orders"
                className={`${location.pathname === '/tenant/orders' ? 'pill-active text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5' : 'pill-inactive text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5'} flex items-center gap-1`}
              >
                Orders
                {activeOrders.length > 0 && (
                  <span className="inline-flex items-center justify-center size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none">
                    {activeOrders.length}
                  </span>
                )}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <ChatNotificationDropdown />
            <span className="text-sm font-medium text-foreground/60 hidden md:inline">{user?.email}</span>
            <button
              onClick={logout}
              className="text-[10px] sm:text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── 3-Column Layout (desktop) / Stacked (mobile) ── */}
      <section className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0 gap-4 sm:gap-6 p-3 sm:p-6 max-w-[1440px] mx-auto w-full">

        {/* ── Left: Unit Context + Quick Actions ───────── */}
        <aside className="flex lg:w-[300px] xl:w-[320px] shrink-0 flex-col gap-4 lg:overflow-y-auto scrollbar-none order-2 lg:order-none">
          {/* Unit info card */}
          <div className="glass-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-foreground/70 mb-1">Your Unit</p>
            <p className="text-2xl font-bold">{unit?.unitNumber ?? '...'}</p>
            <p className="text-sm font-medium text-foreground/70 mb-4">{unit?.property?.name ?? '...'}</p>
            <div className="flex items-center gap-4 text-xs font-medium text-foreground/60 pt-3 border-t border-border/50">
              {unit?.floor != null && (
                <span className="flex items-center gap-1">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15" />
                  </svg>
                  Floor <span className="font-mono font-medium text-foreground">{unit.floor}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
                {user?.name}
              </span>
            </div>
          </div>

          {/* AI Insights card */}
          {insightsSummary && (
            <div className="glass-card p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200" style={{ border: '1px solid rgba(0,0,0,0.12)', borderLeft: '3px solid var(--primary)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
                </svg>
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary">AI Insights</p>
              </div>
              <p className="text-xs text-secondary-foreground leading-relaxed">{insightsSummary}</p>
              <p className="text-[10px] text-foreground/50 font-medium mt-2 flex items-center gap-1">
                <svg className="size-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z" /></svg>
                Powered by Gemini
              </p>
            </div>
          )}

          {/* Quick Report card */}
          <div className="glass-card p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
            <p className="text-[10px] uppercase tracking-wider font-bold text-foreground/70 mb-4">Quick Report</p>
            <div className="space-y-1">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendToChat.current(action.message)}
                  className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-accent/60 transition-colors text-left"
                >
                  <span className={`size-8 rounded-full ${action.color} flex items-center justify-center shrink-0`}>
                    <svg className={`size-4 ${action.iconColor}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d={action.icon} />
                    </svg>
                  </span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Center: Voice Widget (hero) ───────────────── */}
        <div className="lg:flex-1 min-w-0 lg:min-h-0 w-full flex flex-col order-1 lg:order-none">
          <div className="h-[65vh] lg:h-auto lg:flex-1 min-h-0 glass-card-heavy overflow-hidden shadow-2xl flex flex-col">
            <VoiceWidget
              userName={user?.name}
              onSendReady={(fn) => { sendToChat.current = fn; }}
              recap={activeRecap}
              onDismissRecap={() => setRecapDismissed(true)}
            />
          </div>
        </div>

        {/* ── Right: Open Orders + Live Updates + Emergency */}
        <aside className="flex xl:w-[340px] shrink-0 flex-col gap-4 lg:overflow-hidden order-3 lg:order-none">
          {/* Orders header */}
          <div className="flex items-center justify-between shrink-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-foreground/70">My Open Orders</p>
            <Link to="/tenant/orders" className="text-xs text-primary hover:underline font-medium">
              View all
            </Link>
          </div>

          {/* Order cards — scrollable list */}
          <div className="max-h-[30vh] lg:max-h-[40%] min-h-0 overflow-y-auto scrollbar-none space-y-2">
          {activeOrders.length === 0 && (
            <div className="glass-card p-6 text-center" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
              <p className="text-sm font-medium text-foreground/60">No open requests</p>
            </div>
          )}
          {activeOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div
                key={order.id}
                className={`glass-card overflow-hidden border-l-4 ${
                  order.status === 'ESCALATED' ? 'border-l-opsly-urgent' :
                  order.priority === 'URGENT' ? 'border-l-opsly-urgent' :
                  order.priority === 'HIGH' ? 'border-l-opsly-high' :
                  order.priority === 'MEDIUM' ? 'border-l-opsly-medium' :
                  'border-l-transparent'
                } hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer`}
                style={{ border: '1px solid rgba(0,0,0,0.12)', borderLeftWidth: '4px' }}
              >
                <button
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold">{order.orderNumber}</span>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={order.priority} />
                      <svg
                        className={`size-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-secondary-foreground line-clamp-2 mb-2.5 leading-relaxed">
                    {order.issueDescription}
                  </p>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={order.status} />
                    <span className="text-[10px] text-foreground/60 font-mono font-medium">{timeAgo(order.createdAt)}</span>
                  </div>
                  {/* ETA banner when technician is en route */}
                  {order.status === 'EN_ROUTE' && etaMap[order.id] && (() => {
                    const mins = Math.max(1, Math.round((new Date(etaMap[order.id]).getTime() - Date.now()) / 60_000));
                    return (
                      <div className="mt-2 flex items-center gap-1.5 text-primary text-[11px] font-medium bg-primary/10 rounded-lg px-2.5 py-1.5">
                        <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Technician arriving in ~{mins} min
                      </div>
                    );
                  })()}
                </button>

                {/* Timeline expansion */}
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-4 pb-4 pt-1 border-t border-border/30">
                    <div className="space-y-0">
                      {STATUS_STEPS.map((step, idx) => {
                        const stepState = getStepState(step, order.status);
                        return (
                          <div key={step} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`size-5 rounded-full flex items-center justify-center shrink-0 ${
                                stepState === 'done' ? 'bg-opsly-low/20' :
                                stepState === 'current' ? 'bg-primary/20 ring-2 ring-primary/40 animate-pulse' :
                                'bg-muted/40'
                              }`}>
                                {stepState === 'done' ? (
                                  <svg className="size-3 text-opsly-low" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : stepState === 'current' ? (
                                  <div className="size-2 rounded-full bg-primary" />
                                ) : (
                                  <div className="size-2 rounded-full bg-muted-foreground/30" />
                                )}
                              </div>
                              {idx < STATUS_STEPS.length - 1 && (
                                <div className={`w-px h-4 ${stepState === 'done' ? 'bg-opsly-low/40' : 'bg-border/50'}`} />
                              )}
                            </div>
                            <span className={`text-xs pt-0.5 ${
                              stepState === 'current' ? 'font-semibold text-primary' :
                              stepState === 'done' ? 'text-foreground/60' :
                              'text-foreground/40'
                            }`}>
                              {STATUS_LABEL[step]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>{/* end scrollable orders */}

          {/* Spacer between orders and updates */}
          <div className="shrink-0 h-2" />

          {/* Recent Updates — scrollable */}
          {liveUpdates.length > 0 && (
            <div className="glass-card p-5 lg:flex-1 min-h-0 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-200" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
              <div className="flex items-center gap-2 mb-4 shrink-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-foreground/70">Recent Updates</p>
                <span className="size-2 rounded-full bg-opsly-low animate-pulse" />
              </div>
              <div className="space-y-3 overflow-y-auto scrollbar-none flex-1 min-h-0">
                {liveUpdates.map((update, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className={`size-2 rounded-full ${update.dot} mt-1.5 shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-secondary-foreground leading-relaxed">{update.text}</p>
                      <p className="text-[10px] text-foreground/60 font-mono font-medium mt-0.5">{update.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency contact */}
          <div className="glass-card p-5 border-l-[3px] border-l-opsly-urgent shrink-0 hover:shadow-lg hover:-translate-y-1 transition-all duration-200" style={{ border: '1px solid rgba(0,0,0,0.12)', borderLeft: '3px solid var(--opsly-urgent)' }}>
            <p className="text-sm font-semibold text-opsly-urgent mb-1">Emergency?</p>
            <p className="text-sm text-secondary-foreground">
              Call maintenance: <span className="font-mono font-bold text-primary">(555) 911-2847</span>
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
