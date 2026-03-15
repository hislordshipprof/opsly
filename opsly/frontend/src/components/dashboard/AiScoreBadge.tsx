interface AiScoreBadgeProps {
  score: number | null;
}

export function AiScoreBadge({ score }: AiScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted/50 text-foreground/50 border border-border/60">
        <span>—</span>
      </span>
    );
  }

  // Color coding: green >= 0.8, amber 0.5-0.79, red < 0.5
  const colorClass =
    score >= 0.8
      ? 'bg-opsly-low/10 text-white border-opsly-low/30'
      : score >= 0.5
      ? 'bg-opsly-high/10 text-white border-opsly-high/30'
      : 'bg-opsly-urgent/10 text-white border-opsly-urgent/30';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}
      title={`AI confidence: ${(score * 100).toFixed(0)}%`}
    >
      <svg
        className="size-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
      <span className="font-mono">{score.toFixed(2)}</span>
    </span>
  );
}
