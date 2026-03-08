import { useEffect, useRef, type ReactNode } from 'react';
import type { TranscriptEntry } from '@/hooks/useVoiceSession';

/** Lightweight inline markdown: **bold** and " * " list bullets */
function formatMarkdown(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part.replace(/ \* /g, ' \u2022 ');
  });
}

/** Bouncing dots indicator */
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-card/60 text-card-foreground border border-border/50 rounded-lg px-4 py-2.5 flex items-center gap-1 backdrop-blur-sm">
        <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

/** Technician-specific quick action suggestions */
const TECH_SUGGESTIONS = [
  {
    label: "What jobs do I have today?",
    message: "What jobs do I have today?",
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    stroke: true,
  },
  {
    label: 'Update job status',
    message: 'I want to update the status of my current job',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    stroke: true,
  },
  {
    label: 'Mark job complete',
    message: 'Mark my current job as complete',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    stroke: true,
  },
  {
    label: 'I need to escalate',
    message: 'I need to escalate the current job',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    stroke: true,
  },
];

/** Session recap banner */
function RecapBanner({ recap, sessionAge, onDismiss }: { recap: string; sessionAge: string; onDismiss: () => void }) {
  return (
    <div className="animate-in fade-in duration-300 mx-1 mb-2 rounded-xl border border-border/50 bg-accent/30 backdrop-blur-sm px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="size-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Last Session — {sessionAge}</span>
          </div>
          <p className="text-xs text-secondary-foreground leading-relaxed">{recap}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-[10px] text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

interface TechnicianTranscriptDisplayProps {
  entries: TranscriptEntry[];
  isThinking?: boolean;
  userName?: string;
  onSuggestionClick?: (text: string) => void;
  recap?: { recap: string; sessionAge: string } | null;
  onDismissRecap?: () => void;
}

export default function TechnicianTranscriptDisplay({
  entries, isThinking, userName, onSuggestionClick, recap, onDismissRecap,
}: TechnicianTranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length, isThinking]);

  // Empty state — technician greeting + suggestions
  if (entries.length === 0 && !isThinking) {
    const firstName = userName?.split(' ')[0];
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center gap-6 px-6 pt-8 text-center">
        <div>
          <h3 className="text-lg font-bold mb-1">
            {firstName ? `Ready for your next job, ${firstName}?` : 'Ready for your next job?'}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
            Ask about your schedule, update job status, or get directions — I'll handle the rest.
          </p>
        </div>
        {onSuggestionClick && (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            {TECH_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => onSuggestionClick(s.message)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3.5 py-2 text-xs font-medium text-secondary-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/30 transition-all backdrop-blur-sm"
              >
                <svg className="size-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Chat transcript
  return (
    <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto scrollbar-none p-4">
      {recap?.recap && onDismissRecap && (
        <RecapBanner recap={recap.recap} sessionAge={recap.sessionAge} onDismiss={onDismissRecap} />
      )}

      {entries.map((entry, i) => (
        <div
          key={i}
          className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              entry.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-card/60 text-card-foreground border border-border/50 rounded-bl-md backdrop-blur-sm'
            }`}
          >
            {formatMarkdown(entry.content)}
          </div>
        </div>
      ))}
      {isThinking && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
