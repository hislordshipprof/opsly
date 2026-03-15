/**
 * Shared time utilities for OPSLY frontend.
 * All backend timestamps are UTC — these helpers ensure correct parsing.
 */

/**
 * Returns a human-readable relative time string (e.g. "just now", "5m ago", "2h 15m ago", "3d ago").
 * Handles timezone safety: if the ISO string lacks a timezone indicator, assumes UTC.
 */
export function timeAgo(dateStr: string): string {
  const ms = Date.now() - parseUTC(dateStr).getTime();

  if (ms < 60_000) return 'just now';

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Formats a date string for display (e.g. "Mar 14, 10:30 AM").
 * Uses the browser's locale-aware formatting.
 */
export function formatDate(dateStr: string): string {
  return parseUTC(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Parse a date string ensuring UTC interpretation.
 * Backend timestamps are always UTC but may arrive without 'Z' suffix
 * depending on serialization — this forces correct UTC parsing.
 */
function parseUTC(dateStr: string): Date {
  if (
    dateStr.includes('T') &&
    !dateStr.endsWith('Z') &&
    !/[+-]\d{2}(:\d{2})?$/.test(dateStr)
  ) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}
