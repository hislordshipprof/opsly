import type { VoiceState } from '@/hooks/useVoiceSession';

interface AudioVisualizerProps {
  state: VoiceState;
}

const BAR_COUNT = 5;
const ACTIVE_STATES: VoiceState[] = ['USER_SPEAKING', 'AGENT_SPEAKING', 'LISTENING'];

/**
 * Animated waveform bars displayed around the mic button.
 * Bars animate with staggered delays when voice is active.
 */
export default function AudioVisualizer({ state }: AudioVisualizerProps) {
  const isActive = ACTIVE_STATES.includes(state);
  const isUserSpeaking = state === 'USER_SPEAKING';
  const isAgentSpeaking = state === 'AGENT_SPEAKING';

  return (
    <div className="flex items-center justify-center gap-[3px] h-8" aria-hidden="true">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const delay = `${i * 120}ms`;
        const barColor = isUserSpeaking
          ? 'bg-opsly-urgent'
          : isAgentSpeaking
          ? 'bg-primary'
          : 'bg-opsly-low';

        return (
          <div
            key={i}
            className={`w-[3px] rounded-full transition-all duration-150 ${
              isActive ? `${barColor} animate-voice-bar` : 'bg-muted-foreground/20 h-1'
            }`}
            style={isActive ? { animationDelay: delay } : undefined}
          />
        );
      })}
    </div>
  );
}
