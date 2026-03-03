import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '@/hooks/useVoiceSession';

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
            {entry.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
