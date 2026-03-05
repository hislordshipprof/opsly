import type { VoiceState } from '@/hooks/useVoiceSession';

interface ConnectionBadgeProps {
  state: VoiceState;
  agentName: string;
  isSending?: boolean;
}

const DOT_COLORS: Record<VoiceState, string> = {
  IDLE: 'bg-opsly-low',
  CONNECTING: 'bg-opsly-high animate-pulse',
  LISTENING: 'bg-opsly-low',
  USER_SPEAKING: 'bg-opsly-urgent',
  AGENT_THINKING: 'bg-opsly-medium animate-pulse',
  AGENT_SPEAKING: 'bg-opsly-accent',
  ERROR: 'bg-destructive',
};

const STATE_TEXT: Record<VoiceState, string> = {
  IDLE: 'Ready',
  CONNECTING: 'Connecting',
  LISTENING: 'Listening',
  USER_SPEAKING: 'You\'re speaking',
  AGENT_THINKING: 'Processing',
  AGENT_SPEAKING: 'Agent speaking',
  ERROR: 'Connection error',
};

export default function ConnectionBadge({ state, agentName, isSending }: ConnectionBadgeProps) {
  // Determine display status — prioritize isSending over voice state when IDLE
  const displayStatus = state === 'IDLE' && isSending ? 'SENDING' : state;
  const dotColor = displayStatus === 'SENDING' ? 'bg-opsly-high animate-pulse' : DOT_COLORS[state];
  const statusText = displayStatus === 'SENDING' ? 'Sending...' : STATE_TEXT[state];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{statusText}</span>
      </div>
      {state !== 'IDLE' && state !== 'ERROR' && (
        <div className="rounded-full border border-border bg-card px-3 py-1.5">
          <span className="text-xs font-medium text-primary">{agentName}</span>
        </div>
      )}
    </div>
  );
}
