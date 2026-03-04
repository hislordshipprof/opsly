import { useCallback } from 'react';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { useAuth } from '@/hooks/useAuth';
import MicButton from './MicButton';
import ConnectionBadge from './ConnectionBadge';
import TranscriptDisplay from './TranscriptDisplay';
import FallbackTextInput from './FallbackTextInput';
import * as api from '@/services/api';

/**
 * Self-contained voice widget — no parent state needed.
 * Connects to Gemini Live API, handles audio, displays transcript.
 * Falls back to text input if mic is unavailable.
 */
export default function VoiceWidget() {
  const { user } = useAuth();

  /** Route tool calls from Gemini to our backend REST API */
  const handleToolCall = useCallback(async (call: { name: string; args: Record<string, unknown> }) => {
    switch (call.name) {
      case 'get_unit_by_tenant':
        return api.getUnitByTenant((call.args.tenant_id as string) || user?.id || '');

      case 'create_work_order':
        return api.createWorkOrder({
          unitId: call.args.unit_id as string,
          issueCategory: call.args.issue_category as string,
          issueDescription: call.args.issue_description as string,
        });

      case 'get_work_order':
        return api.getWorkOrderByNumber(call.args.order_number as string);

      case 'get_open_work_orders':
        return api.getOpenWorkOrders();

      case 'get_technician_schedule':
        return api.getTechnicianSchedule();

      case 'update_work_order_status': {
        const orderNumber = call.args.order_number as string;
        // We need to look up the ID from the order number first
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
  }, [user?.id]);

  const { state, transcript, activeAgent, error, start, stop } = useVoiceSession({
    onToolCall: handleToolCall,
  });

  /** Send text as if it were a voice message (fallback path) */
  function handleTextSend(text: string) {
    // For text fallback, we'd use the chat API instead
    // This is a simplified path — full implementation would call POST /ai/chat
    console.log('Text fallback:', text);
  }

  return (
    <div className="flex h-full w-full max-w-lg flex-col rounded-lg border border-border bg-card">
      {/* Header — connection status + agent badge */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">OPSLY Voice</h2>
        <ConnectionBadge state={state} agentName={activeAgent} />
      </div>

      {/* Transcript area */}
      <TranscriptDisplay entries={transcript} />

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Controls — mic button + text fallback */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-4">
          <MicButton state={state} onStart={start} onStop={stop} />
          <div className="flex-1">
            <FallbackTextInput
              onSend={handleTextSend}
              disabled={state === 'CONNECTING'}
            />
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {state === 'IDLE'
            ? 'Click the mic to start a voice conversation'
            : 'You can also type while the voice session is active'}
        </p>
      </div>
    </div>
  );
}
