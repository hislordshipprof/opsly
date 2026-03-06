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

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
  isThinking?: boolean;
}

export default function TranscriptDisplay({ entries, isThinking }: TranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length, isThinking]);

  if (entries.length === 0 && !isThinking) {
    return (
      <div className="flex min-h-[250px] items-center justify-center text-sm text-muted-foreground">
        <p>Conversation will appear here...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[250px] max-h-[450px] flex-col gap-3 overflow-y-auto scrollbar-none p-4">
      {entries.map((entry, i) => {
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
