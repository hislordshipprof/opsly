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

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
}

export default function TranscriptDisplay({ entries }: TranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        <p>Conversation will appear here...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              entry.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-card-foreground border border-border'
            }`}
          >
            {formatMarkdown(entry.content)}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
