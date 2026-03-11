import { useCallback, useEffect, useRef, useState } from 'react';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { useAuth } from '@/hooks/useAuth';
import MicButton from '@/components/voice/MicButton';
import ConnectionBadge from '@/components/voice/ConnectionBadge';
import FallbackTextInput from '@/components/voice/FallbackTextInput';
import AgentStatusBadge from '@/components/voice/AgentStatusBadge';
import ActionConfirmation from '@/components/voice/ActionConfirmation';
import TechnicianTranscriptDisplay from './TechnicianTranscriptDisplay';
import * as api from '@/services/api';

/**
 * Technician-focused voice widget — no photo upload, no tenant-specific tools.
 * Connects to the same chat/voice API but scoped to technician actions:
 * schedule queries, status updates, job completion, escalation.
 */
interface TechnicianVoiceWidgetProps {
  userName?: string;
  /** Currently selected work order number — gives the agent job context */
  selectedWorkOrderNumber?: string;
  /** Session recap from last conversation */
  recap?: { recap: string; sessionAge: string } | null;
  onDismissRecap?: () => void;
}

export default function TechnicianVoiceWidget({
  userName, selectedWorkOrderNumber, recap, onDismissRecap,
}: TechnicianVoiceWidgetProps) {
  const { user } = useAuth();
  const chatSessionRef = useRef<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  /** Route tool calls from Gemini to our backend REST API — technician scope only */
  const handleToolCall = useCallback(async (call: { name: string; args: Record<string, unknown> }) => {
    setPendingAction(call.name);
    try {
      return await executeToolCall(call);
    } finally {
      setPendingAction(null);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Execute technician-scoped tool calls */
  async function executeToolCall(call: { name: string; args: Record<string, unknown> }) {
    switch (call.name) {
      case 'get_technician_schedule':
        return api.getTechnicianSchedule();

      case 'get_work_order':
        return api.getWorkOrderByNumber(call.args.order_number as string);

      case 'get_open_work_orders':
        return api.getOpenWorkOrders();

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

  const { state, transcript, activeAgent, error, start, stop, sendText, setActiveAgent, addTranscript } = useVoiceSession({
    onToolCall: handleToolCall,
  });

  /** Send text via the REST chat API (fallback when voice is not active) */
  async function handleTextSend(text: string) {
    // Prepend job context on first message if a work order is selected
    const contextPrefix = selectedWorkOrderNumber && !chatSessionRef.current
      ? `[Context: I'm currently looking at job ${selectedWorkOrderNumber}] `
      : '';

    addTranscript('user', text);
    setIsSending(true);
    try {
      const res = await api.chat(contextPrefix + text, chatSessionRef.current ?? undefined);
      chatSessionRef.current = res.sessionId;
      if (res.agentName) setActiveAgent(res.agentName);
      addTranscript('assistant', res.text);
    } catch {
      addTranscript('assistant', 'Sorry, something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  }

  /** Smart send — route through voice when active, REST otherwise */
  function handleSmartSend(text: string) {
    if (sendText(text)) return;
    handleTextSend(text);
  }

  /** Quick action click — start voice session with text injected BEFORE mic,
   *  so the agent processes the query and reads it aloud. Mic stays live for follow-up. */
  const handleSuggestionClick = useCallback(async (text: string) => {
    // If voice is already active, send directly into the live session
    if (sendText(text)) return;

    // Voice not active — start session with initial text (sent before audio capture)
    addTranscript('user', text);
    try {
      await start(text);
    } catch {
      // Voice failed — fall back to text chat
      handleTextSend(text);
    }
  }, [sendText, start, addTranscript]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset chat session when selected work order changes so context prefix re-fires
  useEffect(() => {
    chatSessionRef.current = null;
  }, [selectedWorkOrderNumber]);

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

      {/* Transcript area — technician variant */}
      <TechnicianTranscriptDisplay
        entries={transcript}
        isThinking={isSending}
        userName={userName}
        onSuggestionClick={handleSuggestionClick}
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

      {/* Controls — mic + text input only (no camera button) */}
      <div className="mt-auto border-t border-border/50 p-3">
        <div className="flex items-center gap-2">
          <MicButton state={state} onStart={start} onStop={stop} />
          <FallbackTextInput
            onSend={handleSmartSend}
            disabled={state === 'CONNECTING' || isSending}
          />
        </div>
      </div>
    </div>
  );
}
