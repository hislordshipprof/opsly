import type { VoiceState } from '@/hooks/useVoiceSession';

interface MicButtonProps {
  state: VoiceState;
  onStart: () => void;
  onStop: () => void;
}

const STATE_STYLES: Record<VoiceState, string> = {
  IDLE: 'bg-primary hover:bg-primary/90',
  CONNECTING: 'bg-muted animate-pulse cursor-wait',
  LISTENING: 'bg-opsly-low hover:bg-opsly-low/90 animate-pulse',
  USER_SPEAKING: 'bg-opsly-urgent ring-4 ring-opsly-urgent/30',
  AGENT_THINKING: 'bg-opsly-medium animate-pulse cursor-wait',
  AGENT_SPEAKING: 'bg-opsly-accent animate-pulse',
  ERROR: 'bg-destructive hover:bg-destructive/90',
};

const STATE_LABELS: Record<VoiceState, string> = {
  IDLE: 'Start voice',
  CONNECTING: 'Connecting...',
  LISTENING: 'Listening...',
  USER_SPEAKING: 'Speaking...',
  AGENT_THINKING: 'Thinking...',
  AGENT_SPEAKING: 'Agent speaking...',
  ERROR: 'Retry',
};

export default function MicButton({ state, onStart, onStop }: MicButtonProps) {
  const isActive = state !== 'IDLE' && state !== 'ERROR';
  const isDisabled = state === 'CONNECTING' || state === 'AGENT_THINKING';

  function handleClick() {
    if (isActive) {
      onStop();
    } else {
      onStart();
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={STATE_LABELS[state]}
      className={`flex h-16 w-16 items-center justify-center rounded-full text-white transition-all disabled:opacity-70 ${STATE_STYLES[state]}`}
    >
      {isActive ? (
        /* Stop icon */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
      ) : (
        /* Mic icon */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
          <path d="M6 11a1 1 0 1 0-2 0 8 8 0 0 0 7 7.93V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07A8 8 0 0 0 20 11a1 1 0 1 0-2 0 6 6 0 0 1-12 0Z" />
        </svg>
      )}
    </button>
  );
}
