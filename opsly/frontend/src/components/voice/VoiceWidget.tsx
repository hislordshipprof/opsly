import { useCallback, useEffect, useRef, useState } from 'react';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { useAuth } from '@/hooks/useAuth';
import MicButton from './MicButton';
import ConnectionBadge from './ConnectionBadge';
import TranscriptDisplay from './TranscriptDisplay';
import FallbackTextInput from './FallbackTextInput';
import AgentStatusBadge from './AgentStatusBadge';
import ActionConfirmation from './ActionConfirmation';
import * as api from '@/services/api';

/**
 * Self-contained voice widget — no parent state needed.
 * Connects to Gemini Live API, handles audio, displays transcript.
 * Falls back to text input if mic is unavailable.
 */
interface VoiceWidgetProps {
  userName?: string;
  /** Parent calls this ref to send a message into the chat from outside */
  onSendReady?: (send: (text: string) => void) => void;
  /** Session recap from last conversation */
  recap?: { recap: string; sessionAge: string } | null;
  onDismissRecap?: () => void;
}

export default function VoiceWidget({ userName, onSendReady, recap, onDismissRecap }: VoiceWidgetProps) {
  const { user } = useAuth();
  const chatSessionRef = useRef<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [currentWorkOrderId, setCurrentWorkOrderId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoRef = useRef<File | null>(null);

  /** Route tool calls from Gemini to our backend REST API */
  const handleToolCall = useCallback(async (call: { name: string; args: Record<string, unknown> }) => {
    setPendingAction(call.name);
    try {
      return await executeToolCall(call);
    } finally {
      setPendingAction(null);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Execute the actual tool call */
  async function executeToolCall(call: { name: string; args: Record<string, unknown> }) {
    switch (call.name) {
      case 'get_unit_by_tenant':
        return api.getUnitByTenant((call.args.tenant_id as string) || user?.id || '');

      case 'create_work_order': {
        const workOrder = await api.createWorkOrder({
          unitId: call.args.unit_id as string,
          issueCategory: call.args.issue_category as string,
          issueDescription: call.args.issue_description as string,
          priority: call.args.priority as string | undefined,
        });
        setCurrentWorkOrderId(workOrder.id);
        // Attach pending photo and wait for it to complete so AI score + photo
        // are saved to the work order BEFORE the dashboard queries it
        console.log('[VoiceWidget] create_work_order tool call — pendingPhoto:', !!pendingPhotoRef.current);
        if (pendingPhotoRef.current) {
          try {
            await api.uploadPhoto(workOrder.id, pendingPhotoRef.current);
          } catch {
            // Photo attachment failed — work order still valid
          } finally {
            pendingPhotoRef.current = null;
          }
        }
        return workOrder;
      }

      case 'get_work_order':
        return api.getWorkOrderByNumber(call.args.order_number as string);

      case 'get_open_work_orders':
        return api.getOpenWorkOrders();

      case 'get_technician_schedule':
        return api.getTechnicianSchedule();

      case 'update_work_order_status': {
        const orderNumber = call.args.order_number as string;
        const order = await api.getWorkOrderByNumber(orderNumber);
        return api.updateWorkOrderStatus(
          order.id,
          call.args.status as string,
          call.args.notes as string | undefined,
        );
      }

      default:
        return { error: `Unknown tool: ${call.name}` };
    }
  }

  const { state, transcript, activeAgent, error, start, stop, setActiveAgent, addTranscript } = useVoiceSession({
    onToolCall: handleToolCall,
  });

  /** Send text via the chat API (fallback when mic is unavailable or user prefers typing) */
  async function handleTextSend(text: string) {
    addTranscript('user', text);
    setIsSending(true);
    try {
      const res = await api.chat(text, chatSessionRef.current ?? undefined);
      chatSessionRef.current = res.sessionId;
      if (res.agentName) setActiveAgent(res.agentName);
      addTranscript('assistant', res.text);

      // In text chat, tool calls happen on the backend — the frontend never sees them.
      // Detect when a work order was just created by parsing the response for "WO-XXXX",
      // then upload the pending photo and fetch AI maintenance tips.
      const woMatch = res.text.match(/WO-\d+/);
      if (woMatch) {
        // Upload pending photo if any
        if (pendingPhotoRef.current && !currentWorkOrderId) {
          try {
            const wo = await api.getWorkOrderByNumber(woMatch[0]);
            setCurrentWorkOrderId(wo.id);
            await api.uploadPhoto(wo.id, pendingPhotoRef.current);
          } catch {
            // Photo attachment failed — work order still valid
          } finally {
            pendingPhotoRef.current = null;
          }
        }

        // Fetch AI maintenance tips for the reported issue (fire-and-forget)
        api.getMaintenanceTips('general', text).then((tips) => {
          if (tips) addTranscript('assistant', tips, { aiTip: true });
        }).catch(() => {});
      }
    } catch {
      addTranscript('assistant', 'Sorry, something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  }

  // Expose send function to parent (for sidebar quick actions)
  const sendFnRef = useRef(handleTextSend);
  sendFnRef.current = handleTextSend;
  useEffect(() => {
    onSendReady?.((text: string) => sendFnRef.current(text));
  }, [onSendReady]);

  /** Handle photo selection — assess standalone, then feed results to agent */
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (4MB max)
    if (file.size > 4 * 1024 * 1024) {
      addTranscript('assistant', 'Photo is too large. Please upload an image under 4MB.');
      return;
    }

    // Show photo preview in transcript
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      addTranscript('user', `[Photo uploaded: ${file.name}]`, { photoUrl: dataUrl });
    };
    reader.readAsDataURL(file);

    // Stash file so it auto-attaches when work order is created later
    pendingPhotoRef.current = file;
    console.log('[VoiceWidget] Photo stashed in pendingPhotoRef:', file.name, file.size, 'bytes');

    // Assess photo standalone (no work order needed yet)
    setIsUploadingPhoto(true);
    try {
      const result = await api.assessPhotoStandalone(file);
      const a = result.assessment;

      // Feed assessment back into the active chat session so the agent can use it
      if (chatSessionRef.current) {
        const contextMessage = `[Photo assessment completed: damageType=${a.damageType}, severity=${a.severity}, confidence=${a.confidence}, recommendedPriority=${a.recommendedPriority}, observations: ${a.observations?.join('; ') ?? 'none'}]`;
        const res = await api.chat(contextMessage, chatSessionRef.current);
        if (res.agentName) setActiveAgent(res.agentName);
        addTranscript('assistant', res.text);
      } else {
        // No active session — show raw assessment
        addTranscript('assistant',
          `I can see ${a.damageType?.replace(/_/g, ' ')} damage (severity: ${a.severity}). ` +
          `Start a conversation so I can create a work order with this assessment.`);
      }

      // If a work order already exists, attach photo immediately
      if (currentWorkOrderId) {
        console.log('[VoiceWidget] Work order already exists, uploading photo directly to:', currentWorkOrderId);
        await api.uploadPhoto(currentWorkOrderId, file).catch((err) => {
          console.error('[VoiceWidget] Direct photo upload failed:', err);
        });
        pendingPhotoRef.current = null;
      } else {
        console.log('[VoiceWidget] No work order yet — photo will be uploaded after work order creation');
      }
    } catch {
      addTranscript('assistant', 'Failed to analyze photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="flex h-full w-full max-w-lg flex-col rounded-2xl">
      {/* Header — connection status + agent badge */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">OPSLY Voice</h2>
          <AgentStatusBadge agentName={activeAgent} isActive={state !== 'IDLE' && state !== 'ERROR'} />
        </div>
        <ConnectionBadge state={state} agentName={activeAgent} isSending={isSending} />
      </div>

      {/* Transcript area */}
      <TranscriptDisplay
        entries={transcript}
        isThinking={isSending || isUploadingPhoto}
        userName={userName}
        onSuggestionClick={handleTextSend}
        recap={recap}
        onDismissRecap={onDismissRecap}
      />

      {/* Action confirmation — shows what tool the agent is executing */}
      <ActionConfirmation action={pendingAction} />

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Controls — single row: camera, mic, text input, send */}
      <div className="mt-auto border-t border-border/50 p-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        <div className="flex items-center gap-2">
          {/* Camera button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="size-9 rounded-full bg-muted/40 hover:bg-muted/60 backdrop-blur-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            aria-label="Upload photo"
            title="Upload a photo of the issue"
          >
            {isUploadingPhoto ? (
              <svg className="size-4 animate-spin text-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="size-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>

          {/* Mic button — compact */}
          <MicButton state={state} onStart={start} onStop={stop} />

          {/* Text input + send — takes remaining space */}
          <FallbackTextInput
            onSend={handleTextSend}
            disabled={state === 'CONNECTING' || isSending}
          />
        </div>
      </div>
    </div>
  );
}
