import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStopStatus, updateStopEta, updateWorkOrderStatus } from '@/services/api';
import { QUERY_KEYS } from '@/services/query-keys';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { SlaCountdown } from '@/components/dashboard/SlaCountdown';
import { CompletionModal } from './CompletionModal';
import { NeedsPartsModal } from './NeedsPartsModal';
import { PhotoLightbox } from './PhotoLightbox';
import { ChatPanel } from '@/components/chat/ChatPanel';
import type { ScheduleStop } from '@/types';
import { StopStatus } from '@/types';

interface JobDetailProps {
  stop: ScheduleStop;
  onBack: () => void;
}

const ETA_OPTIONS = ['15m', '30m', '45m', '1h'] as const;

export function JobDetailPanel({ stop, onBack }: JobDetailProps) {
  const wo = stop.workOrder;
  const queryClient = useQueryClient();
  const severity = wo.visionAssessment;
  const isEnRoute = stop.status === StopStatus.EN_ROUTE;
  const isOnSite = stop.status === StopStatus.ARRIVED;
  const isActive = isEnRoute || isOnSite; // tech is working this job
  const isDone = stop.status === StopStatus.COMPLETED || stop.status === StopStatus.SKIPPED;
  const isPending = stop.status === StopStatus.PENDING;

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showNeedsPartsModal, setShowNeedsPartsModal] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [selectedEta, setSelectedEta] = useState<string | null>(null);
  const [etaSent, setEtaSent] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [revealedContact, setRevealedContact] = useState<'phone' | 'email' | null>(null);

  /* ── Mutations ──────────────────────────────────────── */

  const stopMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      updateStopStatus(stop.id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule() });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });

  const woMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      updateWorkOrderStatus(wo.id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule() });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });

  const etaMutation = useMutation({
    mutationFn: (eta: string) => updateStopEta(stop.id, eta),
    onSuccess: () => {
      setEtaSent(true);
      setSelectedEta(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule() });
      setTimeout(() => setEtaSent(false), 3000);
    },
  });

  function handleNeedsParts(notes: string) {
    woMutation.mutate(
      { status: 'NEEDS_PARTS', notes },
      { onSuccess: () => setShowNeedsPartsModal(false) },
    );
  }

  function handleComplete(notes: string) {
    stopMutation.mutate(
      { status: StopStatus.COMPLETED, notes: notes || undefined },
      { onSuccess: () => setShowCompletionModal(false) },
    );
  }

  function handleSendEta() {
    if (!selectedEta) return;
    // Convert "15m" / "30m" / "45m" / "1h" to an ISO timestamp from now
    const minutes = selectedEta === '1h' ? 60 : parseInt(selectedEta, 10);
    const eta = new Date(Date.now() + minutes * 60_000).toISOString();
    etaMutation.mutate(eta);
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="glass-card flex-1 flex flex-col overflow-hidden min-h-[500px]">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="px-7 pt-5 pb-4 border-b border-border/40">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-foreground/60 uppercase tracking-widest hover:text-foreground mb-3 transition-colors"
        >
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Queue
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-mono text-[28px] font-extrabold">{wo.orderNumber}</h1>
          <PriorityBadge priority={wo.priority} />
          <StatusBadge status={wo.status} />
          {wo.slaBreached && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-opsly-urgent">
              <span className="size-1.5 rounded-full bg-opsly-urgent" />
              SLA Breached
            </span>
          )}
        </div>
      </div>

      {/* ── Scrollable Content ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-none">

        {/* 2x2 Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <InfoCell icon="location" label="Location Details" value={`${wo.unit.property.address} / ${wo.unit.unitNumber}`} sub={wo.unit.floor != null ? `Floor ${wo.unit.floor}` : 'Ground Floor'} borderRight />
          <InfoCell icon="wrench" label="Issue Category" value={wo.issueCategory.replace(/_/g, ' ')} sub={`Reported by ${wo.reportedBy.name}`} />
          <InfoCell icon="user" label="Tenant Information" value={wo.reportedBy.name} sub={wo.reportedBy.email || 'No contact info'} borderRight />
          <InfoCell icon="clock" label="SLA Deadline" value={wo.slaDeadline ? new Date(wo.slaDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'} sub={wo.slaBreached ? 'Breached \u2014 overdue' : 'Within SLA window'} subColor={wo.slaBreached ? 'text-opsly-urgent' : undefined} />
        </div>

        {/* Contact Row */}
        <div className="flex gap-3 px-7 py-3 border-b border-border/40 flex-wrap items-center">
          <RevealContactBtn
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />}
            label="Call Tenant"
            value={(wo.reportedBy as any).phone ?? 'No phone on file'}
            isRevealed={revealedContact === 'phone'}
            onToggle={() => setRevealedContact(revealedContact === 'phone' ? null : 'phone')}
          />
          <RevealContactBtn
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />}
            label="Email Tenant"
            value={wo.reportedBy.email || 'No email on file'}
            isRevealed={revealedContact === 'email'}
            onToggle={() => setRevealedContact(revealedContact === 'email' ? null : 'email')}
          />
          <ContactBtn
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />}
            label="Get Directions"
          />
          <button
            onClick={() => setShowChat((p) => !p)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
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
        </div>

        {/* Expandable Chat Panel */}
        {showChat && (
          <div className="h-[320px] border-b border-border/40">
            <ChatPanel workOrderId={wo.id} />
          </div>
        )}

        {/* Issue Description */}
        <div className="px-7 py-5 border-b border-border/40">
          <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest mb-2 pl-3 border-l-[3px] border-primary">
            Issue Description
          </p>
          <p className="text-sm text-secondary-foreground leading-relaxed">{wo.issueDescription}</p>
        </div>

        {/* Photo Gallery */}
        {wo.photoUrls?.length > 0 && (
          <div className="px-7 py-5 border-b border-border/40">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70 uppercase tracking-widest mb-3">
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
              Tenant Photos ({wo.photoUrls.length})
            </div>
            <div className="flex gap-3">
              {wo.photoUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxPhoto(url)}
                  className="group relative w-[100px] h-20 rounded-xl overflow-hidden border-2 border-border/60 hover:border-primary hover:scale-[1.04] transition-all cursor-pointer"
                >
                  {/* Gradient placeholder background — always visible behind image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                    <svg className="size-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  </div>
                  {/* Actual image — overlays the placeholder when it loads */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  {i === 0 && severity && (
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider z-10">
                      AI Assessed
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Assessment — Enhanced */}
        {severity && (
          <div className="px-7 py-5 border-b border-border/40 bg-gradient-to-br from-primary/[0.03] to-opsly-low/[0.03]">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                <svg className="size-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Gemini Vision Assessment</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl bg-card/60 border border-border/40">
                <p className="text-[9px] font-bold text-foreground/70 uppercase tracking-wider">Damage Type</p>
                <p className="text-sm font-bold mt-1 capitalize">{severity.damageType?.replace(/_/g, ' ') ?? '\u2014'}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-card/60 border border-border/40">
                <p className="text-[9px] font-bold text-foreground/70 uppercase tracking-wider">Severity</p>
                <p className={`text-sm font-bold mt-1 ${
                  severity.severity === 'HIGH' ? 'text-opsly-urgent' :
                  severity.severity === 'MEDIUM' ? 'text-opsly-high' : 'text-opsly-low'
                }`}>{severity.severity}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-card/60 border border-border/40">
                <p className="text-[9px] font-bold text-foreground/70 uppercase tracking-wider">Confidence</p>
                <p className="text-sm font-mono font-bold mt-1">{Math.round((severity.confidence ?? 0) * 100)}%</p>
              </div>
            </div>

            {severity.recommendations?.length > 0 && (
              <ul className="text-xs text-secondary-foreground leading-relaxed space-y-1">
                {severity.recommendations.map((r: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary shrink-0">&bull;</span>
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ETA Quick Set — only when en route (tenant wants arrival time) */}
        {isEnRoute && (
          <div className="px-7 py-5 border-b border-border/40">
            <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest mb-3">
              Send Arrival ETA to Tenant
            </p>
            <div className="flex gap-2 flex-wrap items-center">
              {ETA_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedEta(t)}
                  className={`font-mono text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
                    selectedEta === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border/60 bg-card/50 text-secondary-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={handleSendEta}
                disabled={!selectedEta || etaMutation.isPending}
                className="ml-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all"
              >
                {etaMutation.isPending ? 'Sending...' : etaSent ? '\u2713 Tenant Notified!' : 'Send ETA'}
              </button>
            </div>
            {etaMutation.isError && (
              <p className="text-xs text-opsly-urgent mt-2">Failed to send ETA. Please try again.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Action Buttons — pinned bottom ──────────────── */}
      <div className="px-7 py-5 border-t border-border/40 space-y-3">

        {/* Mutation success feedback */}
        {woMutation.isSuccess && (
          <div className="p-3 rounded-xl bg-opsly-low/8 border border-opsly-low/15 text-center animate-in fade-in duration-300">
            <span className="text-opsly-low font-bold text-xs">{'\u2713'} Status updated — manager and tenant notified</span>
          </div>
        )}

        {/* PENDING: single "Start En Route" button + secondary actions */}
        {isPending && (
          <div className="flex gap-3">
            <button
              onClick={() => stopMutation.mutate({ status: StopStatus.EN_ROUTE })}
              disabled={stopMutation.isPending}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              {stopMutation.isPending ? 'Updating...' : 'Start En Route'}
            </button>
          </div>
        )}

        {/* EN_ROUTE: "Mark Arrived" primary + Needs Parts + Escalate */}
        {isEnRoute && (
          <div className="flex gap-3">
            <button
              onClick={() => stopMutation.mutate({ status: StopStatus.ARRIVED })}
              disabled={stopMutation.isPending}
              className="flex-1 min-w-[140px] h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {stopMutation.isPending ? 'Updating...' : 'Mark Arrived'}
            </button>
            <button
              onClick={() => setShowNeedsPartsModal(true)}
              disabled={woMutation.isPending}
              className="flex-1 min-w-[120px] h-12 rounded-xl border-[1.5px] border-border text-secondary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary hover:bg-primary/[0.04] transition-all disabled:opacity-50"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25" />
              </svg>
              Needs Parts
            </button>
            <button
              onClick={() => woMutation.mutate({ status: 'ESCALATED' })}
              disabled={woMutation.isPending}
              className="flex-1 min-w-[120px] h-12 rounded-xl border-[1.5px] border-opsly-urgent/30 text-opsly-urgent text-sm font-bold flex items-center justify-center gap-2 hover:bg-opsly-urgent/[0.06] transition-all disabled:opacity-50"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Escalate
            </button>
          </div>
        )}

        {/* ARRIVED (on site): "Mark Complete" primary + Needs Parts + Escalate */}
        {isOnSite && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowCompletionModal(true)}
              disabled={stopMutation.isPending}
              className="flex-1 min-w-[140px] h-12 rounded-xl bg-opsly-low text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Mark Complete
            </button>
            <button
              onClick={() => setShowNeedsPartsModal(true)}
              disabled={woMutation.isPending}
              className="flex-1 min-w-[120px] h-12 rounded-xl border-[1.5px] border-border text-secondary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary hover:bg-primary/[0.04] transition-all disabled:opacity-50"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25" />
              </svg>
              Needs Parts
            </button>
            <button
              onClick={() => woMutation.mutate({ status: 'ESCALATED' })}
              disabled={woMutation.isPending}
              className="flex-1 min-w-[120px] h-12 rounded-xl border-[1.5px] border-opsly-urgent/30 text-opsly-urgent text-sm font-bold flex items-center justify-center gap-2 hover:bg-opsly-urgent/[0.06] transition-all disabled:opacity-50"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Escalate
            </button>
          </div>
        )}

        {/* Completed state */}
        {isDone && (
          <div className="p-4 rounded-xl bg-opsly-low/8 border border-opsly-low/15 text-center">
            <span className="text-opsly-low font-bold text-sm">{'\u2713'} Job Complete</span>
            {wo.resolutionNotes && (
              <p className="text-xs font-medium text-foreground/60 mt-1">{wo.resolutionNotes}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      <CompletionModal
        orderNumber={wo.orderNumber}
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onSubmit={handleComplete}
        isSubmitting={stopMutation.isPending}
      />
      <NeedsPartsModal
        orderNumber={wo.orderNumber}
        isOpen={showNeedsPartsModal}
        onClose={() => setShowNeedsPartsModal(false)}
        onSubmit={handleNeedsParts}
        isSubmitting={woMutation.isPending}
      />
      <PhotoLightbox
        photoUrl={lightboxPhoto}
        assessment={severity}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────── */

const ICONS = {
  location: <><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></>,
  wrench: <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />,
  user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
  clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
};

function InfoCell({ icon, label, value, sub, subColor, borderRight }: {
  icon: keyof typeof ICONS; label: string; value: string; sub: string;
  subColor?: string; borderRight?: boolean;
}) {
  return (
    <div className={`flex gap-3.5 px-7 py-5 border-b border-border/40 ${borderRight ? 'lg:border-r' : ''}`}>
      <div className="size-10 rounded-xl bg-muted/40 flex items-center justify-center text-foreground/60 shrink-0">
        <svg className="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          {ICONS[icon]}
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[15px] font-bold truncate">{value}</p>
        <p className={`text-xs font-medium mt-0.5 ${subColor ?? 'text-foreground/60'}`}>{sub}</p>
      </div>
    </div>
  );
}

function ContactBtn({ icon, label }: {
  icon: React.ReactNode; label: string;
}) {
  return (
    <button
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/60 bg-card/50 text-xs font-semibold text-secondary-foreground hover:border-primary hover:text-primary transition-all"
    >
      <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        {icon}
      </svg>
      {label}
    </button>
  );
}

function RevealContactBtn({ icon, label, value, isRevealed, onToggle }: {
  icon: React.ReactNode; label: string; value: string;
  isRevealed: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
        isRevealed
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border/60 bg-card/50 text-secondary-foreground hover:border-primary hover:text-primary'
      }`}
    >
      <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        {icon}
      </svg>
      {isRevealed ? (
        <span className="font-mono">{value}</span>
      ) : (
        label
      )}
    </button>
  );
}
