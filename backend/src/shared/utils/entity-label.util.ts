/**
 * Format enum-ish names into human-readable labels.
 *
 * Examples:
 * - WORK_PERMIT -> "Work Permit"
 * - DISPATCH_ORDER -> "Dispatch Order"
 * - risk_assessment -> "Risk Assessment"
 */
export function formatEntityLabel(value: string): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

