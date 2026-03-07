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

/** Suggestion chips matching the mockup — bordered, with SVG icons */
const SUGGESTIONS = [
  { label: 'Leak or flooding', message: 'I have a leak or flooding issue', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z' },
  { label: "Something's broken", message: 'Something is broken in my unit', icon: 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z' },
  { label: 'No power / electrical', message: 'I have a power or electrical issue', icon: 'M7 2v11h3v9l7-12h-4l4-8z' },
  { label: "Where's my technician?", message: 'Where is my technician?', icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z' },
];

/** AI Tip card — distinct from regular chat bubbles */
function AiTipCard({ content }: { content: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 mx-1 my-1 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden"
      style={{ borderLeft: '3px solid var(--primary)' }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Tip</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-secondary-foreground">{content}</p>
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
          <svg className="size-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z" /></svg>
          Powered by Gemini
        </p>
      </div>
    </div>
  );
}

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

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
  isThinking?: boolean;
  userName?: string;
  onSuggestionClick?: (text: string) => void;
  recap?: { recap: string; sessionAge: string } | null;
  onDismissRecap?: () => void;
}

export default function TranscriptDisplay({ entries, isThinking, userName, onSuggestionClick, recap, onDismissRecap }: TranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length, isThinking]);

  if (entries.length === 0 && !isThinking) {
    const firstName = userName?.split(' ')[0];
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-6 px-6 text-center">
        <div>
          <h3 className="text-lg font-bold mb-1">
            {firstName ? `Hi ${firstName}, how can we help?` : 'How can we help?'}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
            Describe your issue, upload a photo, or use voice — I'll create a work order and get help on the way.
          </p>
        </div>
        {onSuggestionClick && (
          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => onSuggestionClick(s.message)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3.5 py-2 text-xs font-medium text-secondary-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/30 transition-all backdrop-blur-sm"
              >
                <svg className="size-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
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

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto scrollbar-none p-4">
      {/* Recap banner at top */}
      {recap?.recap && onDismissRecap && (
        <RecapBanner recap={recap.recap} sessionAge={recap.sessionAge} onDismiss={onDismissRecap} />
      )}

      {entries.map((entry, i) => {
        // AI Tip card — special rendering
        if (entry.metadata?.aiTip) {
          return <AiTipCard key={i} content={entry.content} />;
        }

        // Hide raw "[Photo uploaded: ...]" text when there's a photo preview
        const isPhotoPlaceholder = entry.metadata?.photoUrl && entry.content.startsWith('[Photo uploaded');

        return (
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
              {entry.metadata?.photoUrl && (
                <img
                  src={entry.metadata.photoUrl}
                  alt="Uploaded photo"
                  className="max-w-full rounded-lg mb-2"
                  style={{ maxWidth: '200px' }}
                />
              )}
              {!isPhotoPlaceholder && formatMarkdown(entry.content)}
            </div>
          </div>
        );
      })}
      {isThinking && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
