/**
 * Maps raw status to risk register display labels.
 * Only three statuses: open, close, waiting_approval.
 *
 * - Inspection item: uses inspectionItem.status directly
 * - Risk assessment item: uses parent risk assessment status; DONE -> close
 */
export type RiskRegisterStatusLabel = 'Open' | 'Close' | 'Waiting Approval';

export function getRiskRegisterStatusLabel(rawStatus: string): RiskRegisterStatusLabel {
  const s = String(rawStatus).toUpperCase();
  if (s === 'CLOSE' || s === 'DONE') return 'Close';
  if (s === 'WAITING_APPROVAL') return 'Waiting Approval';
  return 'Open';
}
