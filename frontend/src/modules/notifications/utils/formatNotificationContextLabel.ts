/**
 * Formats a notification context slug for display (e.g. risk_assessment → "Risk Assessment").
 * Does not alter the raw value used for routing or badge color keys.
 */
export function formatNotificationContextLabel(context: string): string {
  const normalized = context.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return context;
  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
