import { useState, useEffect } from 'react';

interface SlaCountdownProps {
  slaDeadline: string | null;
  slaBreached: boolean;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Breached';
  const totalMins = Math.floor(ms / 60_000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export function SlaCountdown({ slaDeadline, slaBreached }: SlaCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!slaDeadline) return;

    const calc = () => new Date(slaDeadline).getTime() - Date.now();
    setTimeLeft(calc());

    const interval = setInterval(() => setTimeLeft(calc()), 30_000);
    return () => clearInterval(interval);
  }, [slaDeadline]);

  if (!slaDeadline) {
    return <span className="text-xs text-muted-foreground">--</span>;
  }

  const breached = slaBreached || (timeLeft != null && timeLeft <= 0);
  const critical = timeLeft != null && timeLeft > 0 && timeLeft < 3_600_000;

  if (breached) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-opsly-urgent">
        <span className="size-1.5 rounded-full bg-opsly-urgent animate-pulse" />
        SLA Breached
      </span>
    );
  }

  if (critical) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-opsly-high">
        <span className="size-1.5 rounded-full bg-opsly-high" />
        {formatCountdown(timeLeft!)}
      </span>
    );
  }

  return (
    <span className="text-xs text-muted-foreground font-mono">
      {formatCountdown(timeLeft ?? 0)}
    </span>
  );
}
