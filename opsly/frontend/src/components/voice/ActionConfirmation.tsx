interface ActionConfirmationProps {
  action: string | null;
}

const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  create_work_order: { label: 'Creating work order', icon: '+ ' },
  get_work_order: { label: 'Looking up work order', icon: '' },
  get_open_work_orders: { label: 'Fetching open orders', icon: '' },
  get_unit_by_tenant: { label: 'Finding your unit', icon: '' },
  get_technician_schedule: { label: 'Loading schedule', icon: '' },
  update_work_order_status: { label: 'Updating status', icon: '' },
};

/**
 * Slide-in confirmation showing the tool action the agent is executing.
 * Provides transparency into what the AI is doing.
 */
export default function ActionConfirmation({ action }: ActionConfirmationProps) {
  if (!action) return null;

  const config = ACTION_LABELS[action] ?? { label: action, icon: '' };

  return (
    <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <svg className="size-3.5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <span className="text-xs font-medium text-primary">
        {config.icon}{config.label}...
      </span>
    </div>
  );
}
