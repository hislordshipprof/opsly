import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTechnicianSchedule } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardEvents } from '@/hooks/useWebSocket';
import { JobDetailPanel } from '@/components/technician/JobDetail';
import { SlaCountdown } from '@/components/dashboard/SlaCountdown';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import TechnicianVoiceWidget from '@/components/technician/TechnicianVoiceWidget';
import type { TechnicianSchedule, ScheduleStop } from '@/types';
import { StopStatus } from '@/types';

/* ── Helpers ──────────────────────────────────────────── */

const STOP_LABEL: Record<string, string> = {
  PENDING: 'Queued', EN_ROUTE: 'En Route', ARRIVED: 'On Site',
  COMPLETED: 'Done', SKIPPED: 'Skipped',
};

/* ── Sidebar Job Card ─────────────────────────────────── */

function SidebarJobCard({
  stop, isActive, isRecommended, onClick,
}: {
  stop: ScheduleStop; isActive: boolean; isRecommended: boolean; onClick: () => void;
}) {
  const wo = stop.workOrder;
  const isDone = stop.status === StopStatus.COMPLETED || stop.status === StopStatus.SKIPPED;

  return (
    <div
      onClick={onClick}
      className={`relative glass-card p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
        isActive
          ? 'border-l-4 border-l-primary bg-primary/[0.06]'
          : 'hover:border-border/80'
      } ${isDone ? 'opacity-50' : ''} ${isRecommended ? 'mt-5' : ''}`}
      style={{ border: '1px solid rgba(0,0,0,0.12)', ...(isActive ? { borderLeftWidth: '4px' } : {}) }}
    >
      {isRecommended && !isDone && (
        <span className="absolute -top-2.5 left-3 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest shadow-sm">
          Recommended
        </span>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg glass-card flex items-center justify-center text-sm font-bold text-foreground/70 shrink-0">
            {isDone ? '\u2713' : stop.sequenceNumber}
          </div>
          <span className="font-mono text-sm font-bold">{wo.orderNumber}</span>
          <PriorityBadge priority={wo.priority} />
        </div>
        <div className="text-right">
          <span className={`block text-[10px] font-bold uppercase tracking-tight ${
            stop.status === StopStatus.ARRIVED || stop.status === StopStatus.EN_ROUTE
              ? 'text-opsly-high' : 'text-foreground/70'
          }`}>
            {STOP_LABEL[stop.status]}
          </span>
          <div className="mt-0.5 scale-90 origin-top-right">
            <SlaCountdown slaDeadline={wo.slaDeadline} slaBreached={wo.slaBreached} />
          </div>
        </div>
      </div>

      <p className="text-sm text-foreground/70 font-medium truncate mt-2 pl-11">
        {wo.unit.property.address} / {wo.unit.unitNumber}
      </p>
    </div>
  );
}

/* ── Route Summary Card ───────────────────────────────── */

function RouteSummary({
  schedule, stops, completed, remaining,
}: {
  schedule: TechnicianSchedule | null; stops: ScheduleStop[]; completed: number; remaining: number;
}) {
  const pct = stops.length > 0 ? Math.round((completed / stops.length) * 100) : 0;

  return (
    <div className="glass-card p-6 sm:p-8 mb-4 sm:mb-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
      <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest mb-5">
        Today's Route
      </p>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-mono text-5xl font-extrabold">{remaining}</span>
        <span className="text-xl text-foreground/60 font-semibold">left</span>
      </div>
      <p className="text-sm font-medium text-foreground/60">
        {completed} completed &middot; {stops.length} total
      </p>

      <div className="mt-8 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold text-foreground/70 uppercase tracking-widest">
          <span>{schedule?.region ?? 'Route'}</span>
          <span className="font-mono">{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-border/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-opsly-low transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-border/40">
        <p className="text-[10px] font-semibold text-foreground/60 font-mono uppercase tracking-widest">
          {schedule?.scheduleCode}
        </p>
      </div>
    </div>
  );
}

/* ── Empty Detail State ───────────────────────────────── */

function EmptyDetailState({
  recommendedStop, onSelect,
}: {
  recommendedStop: ScheduleStop | undefined; onSelect: (id: string) => void;
}) {
  return (
    <div className="glass-card flex-1 flex flex-col items-center justify-center text-center p-8 border-dashed" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
      <div className="size-20 rounded-full bg-muted/40 flex items-center justify-center mb-5">
        <svg className="size-9 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2">Select a job to view details</h2>
      <p className="text-foreground/60 font-medium max-w-md mb-8 leading-relaxed">
        Browse your queue on the left and select any job to view full tenant details, location, and issue description.
      </p>

      {recommendedStop && (
        <div
          onClick={() => onSelect(recommendedStop.id)}
          className="glass-card-featured p-5 flex items-center gap-4 max-w-md w-full cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Smart Recommendation</p>
            <p className="text-sm font-bold">Start with {recommendedStop.workOrder.orderNumber}</p>
            <p className="text-xs font-medium text-foreground/60 mt-0.5 truncate">
              {recommendedStop.workOrder.priority} priority &middot; {recommendedStop.workOrder.unit.property.address}
            </p>
          </div>
          <span className="text-xs font-bold text-primary shrink-0">View &rarr;</span>
        </div>
      )}
    </div>
  );
}

/* ── History Card ─────────────────────────────────────── */

function HistoryCard({ stop }: { stop: ScheduleStop }) {
  const wo = stop.workOrder;

  return (
    <div className="glass-card p-5 flex items-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
      <div className="size-9 rounded-xl bg-opsly-low/8 flex items-center justify-center text-opsly-low font-bold text-sm shrink-0">
        {'\u2713'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-sm font-bold">{wo.orderNumber}</span>
          <PriorityBadge priority={wo.priority} />
        </div>
        <p className="text-xs font-medium text-foreground/60 truncate">
          {wo.unit.property.address} / {wo.unit.unitNumber} &mdash; {wo.issueDescription}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-[11px] font-medium text-foreground/60">
          {stop.actualArrival
            ? new Date(stop.actualArrival).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : 'Today'}
        </p>
        {wo.resolutionNotes && (
          <p className="text-[11px] font-medium text-foreground/60 mt-0.5 max-w-[160px] truncate">
            {wo.resolutionNotes}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── History View ─────────────────────────────────────── */

function HistoryView({ completedStops }: { completedStops: ScheduleStop[] }) {
  return (
    <div className="glass-card p-7 flex-1 overflow-y-auto scrollbar-none" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Job History</h2>
        <span className="text-xs font-medium text-foreground/60">
          {completedStops.length} job{completedStops.length !== 1 ? 's' : ''} completed today
        </span>
      </div>

      {completedStops.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="size-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
            <svg className="size-7 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-lg font-bold mb-1">No completed jobs yet</p>
          <p className="text-sm font-medium text-foreground/60 max-w-sm">
            Jobs you complete today will appear here with resolution notes and timestamps.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedStops.map((stop) => (
            <HistoryCard key={stop.id} stop={stop} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Inline Chat Column ───────────────────────────────── */

function ChatColumn({ selectedWorkOrderNumber }: { selectedWorkOrderNumber?: string }) {
  return (
    <aside className="hidden xl:flex w-[380px] shrink-0">
      <div className="glass-card-heavy overflow-hidden shadow-lg ring-1 ring-border/10 w-full flex flex-col" style={{ height: 'calc(100vh - 128px)' }}>
        <TechnicianVoiceWidget selectedWorkOrderNumber={selectedWorkOrderNumber} />
      </div>
    </aside>
  );
}

/* ── Main Page ────────────────────────────────────────── */

export default function TechnicianDashboardPage() {
  const { user, logout } = useAuth();
  const { isConnected } = useDashboardEvents();
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'history'>('jobs');
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);

  const { data: schedule, isLoading } = useQuery<TechnicianSchedule | null>({
    queryKey: QUERY_KEYS.schedule(),
    queryFn: () => getTechnicianSchedule(),
    refetchInterval: false,
  });

  const stops = schedule?.stops ?? [];
  const activeStop = stops.find((s) => s.id === activeStopId) ?? null;
  const completedStops = stops.filter((s) => s.status === StopStatus.COMPLETED || s.status === StopStatus.SKIPPED);
  const completed = completedStops.length;
  const remaining = stops.length - completed;
  const recommendedStop = stops.find((s) => s.status === StopStatus.ARRIVED || s.status === StopStatus.EN_ROUTE)
    ?? stops.find((s) => s.status === StopStatus.PENDING);

  // Auto-select highest priority job on first load
  useEffect(() => {
    if (recommendedStop && !activeStopId) {
      setActiveStopId(recommendedStop.id);
    }
  }, [recommendedStop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear active selection when all jobs are done so "All clear" renders
  useEffect(() => {
    if (remaining === 0 && stops.length > 0) {
      setActiveStopId(null);
    }
  }, [remaining, stops.length]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-role-tenant">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="glass-nav shrink-0 z-30 px-3 sm:px-6 h-14 sm:h-16 w-full">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-8 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight select-none shrink-0">OPSLY</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`${activeTab === 'jobs' ? 'pill-active' : 'pill-inactive'} text-xs`}
              >
                My Jobs
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${activeTab === 'history' ? 'pill-active' : 'pill-inactive'} text-xs`}
              >
                History
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-5 shrink-0">
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-opsly-low/8 border border-opsly-low/15">
              <span className="relative flex size-2">
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-opsly-low opacity-75" />}
                <span className={`relative inline-flex rounded-full size-2 ${isConnected ? 'bg-opsly-low' : 'bg-muted-foreground'}`} />
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'text-opsly-low' : 'text-foreground/60'} hidden sm:inline`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold leading-none">{user?.email?.split('@')[0] ?? 'Technician'}</p>
                <p className="text-[10px] font-medium text-foreground/60 mt-0.5">Senior Technician</p>
              </div>
              <div className="size-8 sm:size-10 rounded-full bg-muted/60 flex items-center justify-center ring-1 ring-border">
                <span className="text-xs sm:text-sm font-bold text-foreground/70">
                  {user?.email?.charAt(0).toUpperCase() ?? 'T'}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-xs sm:text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────── */}
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-6 py-3 sm:py-6 flex flex-col md:flex-row gap-4 sm:gap-6 flex-1 min-h-0 overflow-hidden">

        {/* Loading skeleton */}
        {isLoading && (
          <>
            <aside className="w-full md:w-[340px] xl:w-[400px] shrink-0 space-y-4">
              <div className="glass-card h-64 animate-pulse" style={{ border: '1px solid rgba(0,0,0,0.12)' }} />
              <div className="glass-card h-20 animate-pulse" style={{ border: '1px solid rgba(0,0,0,0.12)' }} />
              <div className="glass-card h-20 animate-pulse" style={{ border: '1px solid rgba(0,0,0,0.12)' }} />
            </aside>
            <section className="flex-1">
              <div className="glass-card h-[500px] animate-pulse" style={{ border: '1px solid rgba(0,0,0,0.12)' }} />
            </section>
          </>
        )}

        {/* ═══ MY JOBS TAB ═══════════════════════════════ */}
        {!isLoading && activeTab === 'jobs' && (
          <>
            {/* Sidebar: Queue */}
            {stops.length > 0 && (
              <aside className="w-full md:w-[340px] xl:w-[400px] flex flex-col shrink-0 min-h-0 overflow-y-auto scrollbar-none">
                <RouteSummary
                  schedule={schedule ?? null}
                  stops={stops}
                  completed={completed}
                  remaining={remaining}
                />

                <div className="glass-card p-5 flex-1 flex flex-col min-h-0" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
                  <div className="flex items-center justify-between mb-5 shrink-0">
                    <h2 className="text-lg font-bold">Today's Queue</h2>
                    <span className="text-[10px] font-bold text-foreground/70 px-2 py-1 rounded bg-muted/50 uppercase tracking-wider">
                      {completed}/{stops.length} Complete
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto flex-1 min-h-0 scrollbar-none">
                    {[...stops]
                      .sort((a, b) => {
                        const aDone = a.status === StopStatus.COMPLETED || a.status === StopStatus.SKIPPED;
                        const bDone = b.status === StopStatus.COMPLETED || b.status === StopStatus.SKIPPED;
                        if (aDone !== bDone) return aDone ? 1 : -1;
                        return a.sequenceNumber - b.sequenceNumber;
                      })
                      .map((stop) => (
                        <SidebarJobCard
                          key={stop.id}
                          stop={stop}
                          isActive={activeStopId === stop.id}
                          isRecommended={stop.id === recommendedStop?.id}
                          onClick={() => setActiveStopId(stop.id)}
                        />
                      ))}
                  </div>
                </div>
              </aside>
            )}

            {/* Detail Panel + Chat — active jobs */}
            {stops.length > 0 && remaining > 0 && (
              <>
                <section className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto scrollbar-none">
                  {activeStop ? (
                    <JobDetailPanel stop={activeStop} onBack={() => setActiveStopId(null)} />
                  ) : (
                    <EmptyDetailState recommendedStop={recommendedStop} onSelect={setActiveStopId} />
                  )}
                </section>
                <ChatColumn selectedWorkOrderNumber={activeStop?.workOrder.orderNumber} />
              </>
            )}

            {/* All jobs completed — or no schedule */}
            {((stops.length === 0) || (stops.length > 0 && remaining === 0 && !activeStop)) && (
              <>
                <section className="flex-1 flex items-center justify-center">
                  <div className="glass-card p-12 flex flex-col items-center text-center max-w-md" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
                    <div className="size-20 rounded-full bg-opsly-low/10 flex items-center justify-center mb-4">
                      <span className="text-3xl text-opsly-low">&#10003;</span>
                    </div>
                    <p className="text-lg font-bold">All clear for today</p>
                    <p className="text-sm font-medium text-foreground/60 mt-1 max-w-sm">
                      No jobs scheduled. Use the voice widget to check for updates.
                    </p>
                  </div>
                </section>
                <ChatColumn />
              </>
            )}
          </>
        )}

        {/* ═══ HISTORY TAB ═══════════════════════════════ */}
        {!isLoading && activeTab === 'history' && (
          <>
            <section className="flex-1 flex flex-col min-w-0">
              <HistoryView completedStops={completedStops} />
            </section>
            <ChatColumn />
          </>
        )}
      </main>

      {/* ── Floating Voice Button (below xl only) ──────── */}
      <button
        onClick={() => setVoicePanelOpen(true)}
        className="fixed bottom-6 right-6 z-40 xl:hidden size-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
        aria-label="Open OPSLY Voice"
      >
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      </button>

      {/* ── Voice Slide-over Panel (below xl only) ──────── */}
      {voicePanelOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setVoicePanelOpen(false)} />
          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md flex flex-col animate-in slide-in-from-right duration-200">
            <div className="glass-card-heavy m-3 mt-3 flex-1 flex flex-col overflow-hidden shadow-2xl ring-1 ring-border/10 rounded-2xl">
              {/* Close button */}
              <button
                onClick={() => setVoicePanelOpen(false)}
                className="absolute top-5 right-5 z-10 size-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close voice panel"
              >
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              <TechnicianVoiceWidget selectedWorkOrderNumber={activeStop?.workOrder.orderNumber} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
