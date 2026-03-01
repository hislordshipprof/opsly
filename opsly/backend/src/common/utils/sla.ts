import { Priority } from '@prisma/client';

/** SLA windows in hours, keyed by priority */
const SLA_HOURS: Record<Priority, number> = {
  [Priority.URGENT]: 2,
  [Priority.HIGH]: 4,
  [Priority.MEDIUM]: 24,
  [Priority.LOW]: 72,
};

/**
 * Computes the SLA deadline based on priority.
 * Called when a work order is created or priority changes.
 */
export function computeSlaDeadline(
  priority: Priority,
  createdAt: Date = new Date(),
): Date {
  const hours = SLA_HOURS[priority];
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Checks whether the SLA deadline has been breached.
 * A breached SLA means current time exceeds deadline and
 * the work order is still in an active (non-terminal) status.
 */
export function isSlaBreached(slaDeadline: Date | null): boolean {
  if (!slaDeadline) return false;
  return new Date() > slaDeadline;
}
