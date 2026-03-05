import { useCallback, useRef, useState } from 'react';
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

      case 'create_work_order': {
        const workOrder = await api.createWorkOrder({
          unitId: call.args.unit_id as string,
          issueCategory: call.args.issue_category as string,
          issueDescription: call.args.issue_description as string,
        });
        // Store work order ID so we can attach photos to it
        setCurrentWorkOrderId(workOrder.id);
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

  const { state, transcript, activeAgent, error, start, stop, setActiveAgent, addTranscript } = useVoiceSession({
    onToolCall: handleToolCall,
  });

  const chatSessionRef = useRef<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [currentWorkOrderId, setCurrentWorkOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Send text via the chat API (fallback when mic is unavailable or user prefers typing) */
  async function handleTextSend(text: string) {
    addTranscript('user', text);
    setIsSending(true);
    try {
      const res = await api.chat(text, chatSessionRef.current ?? undefined);
      chatSessionRef.current = res.sessionId;
      if (res.agentName) setActiveAgent(res.agentName);
      addTranscript('assistant', res.text);
    } catch {
      addTranscript('assistant', 'Sorry, something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  }

  /** Handle photo selection and upload */
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if we have a work order ID to attach the photo to
    if (!currentWorkOrderId) {
      addTranscript('assistant', 'Please create a work order first before uploading a photo.');
      return;
    }

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

    // Upload to backend
    setIsUploadingPhoto(true);
    addTranscript('assistant', 'Analyzing photo...');
    try {
      const result = await api.uploadPhoto(currentWorkOrderId, file);

      // Show assessment result
      const assessmentText = `Photo analyzed successfully!\n\n` +
        `Damage Type: ${result.visionAssessment.damageType}\n` +
        `Severity: ${result.visionAssessment.severity}\n` +
        `Confidence: ${Math.round(result.visionAssessment.confidence * 100)}%\n` +
        `Recommended Priority: ${result.visionAssessment.recommendedPriority}\n\n` +
        `${result.visionAssessment.description}`;

      addTranscript('assistant', assessmentText);

      // Send assessment to agent context if chat session is active
      if (chatSessionRef.current) {
        const contextMessage = `[Photo assessment: ${result.visionAssessment.damageType}, severity: ${result.visionAssessment.severity}]`;
        await api.chat(contextMessage, chatSessionRef.current);
      }
    } catch (error) {
      addTranscript('assistant', 'Failed to analyze photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="flex h-full w-full max-w-lg flex-col rounded-lg border border-border bg-card">
      {/* Header — connection status + agent badge */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">OPSLY Voice</h2>
        <ConnectionBadge state={state} agentName={activeAgent} isSending={isSending} />
      </div>

      {/* Transcript area */}
      <TranscriptDisplay entries={transcript} />

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Controls — photo button + mic button + text fallback */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {/* Photo upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto || !currentWorkOrderId}
            className="size-12 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Upload photo"
            title={currentWorkOrderId ? 'Upload photo' : 'Create a work order first'}
          >
            {isUploadingPhoto ? (
              <svg className="size-6 animate-spin text-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="size-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>

          <MicButton state={state} onStart={start} onStop={stop} />
          <div className="flex-1">
            <FallbackTextInput
              onSend={handleTextSend}
              disabled={state === 'CONNECTING' || isSending}
            />
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {state === 'IDLE'
            ? 'Click the mic to start a voice conversation or upload a photo'
            : 'You can also type or upload photos while the voice session is active'}
        </p>
      </div>
    </div>
  );
}
