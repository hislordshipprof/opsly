import type { VoiceState } from '@/hooks/useVoiceSession';

interface ConnectionBadgeProps {
  state: VoiceState;
  agentName: string;
}

const DOT_COLORS: Record<VoiceState, string> = {
  IDLE: 'bg-muted-foreground',
  CONNECTING: 'bg-opsly-high animate-pulse',
  LISTENING: 'bg-opsly-low',
  USER_SPEAKING: 'bg-opsly-urgent',
  AGENT_THINKING: 'bg-opsly-medium animate-pulse',
  AGENT_SPEAKING: 'bg-opsly-accent',
  ERROR: 'bg-destructive',
};

const STATE_TEXT: Record<VoiceState, string> = {
  IDLE: 'Offline',
  CONNECTING: 'Connecting',
  LISTENING: 'Listening',
  USER_SPEAKING: 'You\'re speaking',
  AGENT_THINKING: 'Processing',
  AGENT_SPEAKING: 'Agent speaking',
  ERROR: 'Connection error',
};

export default function ConnectionBadge({ state, agentName }: ConnectionBadgeProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
        <span className={`h-2 w-2 rounded-full ${DOT_COLORS[state]}`} />
        <span className="text-xs text-muted-foreground">{STATE_TEXT[state]}</span>
      </div>
      {state !== 'IDLE' && state !== 'ERROR' && (
        <div className="rounded-full border border-border bg-card px-3 py-1.5">
          <span className="text-xs font-medium text-primary">{agentName}</span>
        </div>
      )}
    </div>
  );
}
