interface AgentStatusBadgeProps {
  agentName: string;
  isActive: boolean;
}

const AGENT_LABELS: Record<string, { label: string; color: string }> = {
  OpslyRouter: { label: 'Triage', color: 'bg-primary/10 text-primary border-primary/20' },
  TriageAgent: { label: 'Triage', color: 'bg-primary/10 text-primary border-primary/20' },
  StatusAgent: { label: 'Status', color: 'bg-opsly-medium/10 text-opsly-medium border-opsly-medium/20' },
  ScheduleAgent: { label: 'Schedule', color: 'bg-opsly-high/10 text-opsly-high border-opsly-high/20' },
  MaintenanceAgent: { label: 'Maintenance', color: 'bg-opsly-low/10 text-opsly-low border-opsly-low/20' },
  EscalationAgent: { label: 'Escalation', color: 'bg-opsly-urgent/10 text-opsly-urgent border-opsly-urgent/20' },
};

/**
 * Shows which AI agent is currently handling the conversation.
 * Color-coded by agent role for quick visual identification.
 */
export default function AgentStatusBadge({ agentName, isActive }: AgentStatusBadgeProps) {
  if (!isActive) return null;

  const config = AGENT_LABELS[agentName] ?? { label: agentName, color: 'bg-muted/10 text-muted-foreground border-border' };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${config.color}`}>
      <svg className="size-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.07A7.001 7.001 0 0 1 7.07 19H6a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h-1V5.73A2.002 2.002 0 0 1 12 2Zm-1 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
      </svg>
      {config.label} Agent
    </div>
  );
}
