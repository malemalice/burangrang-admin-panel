/**
 * Approval chain status values.
 * Used when checking master approval item status and overall approval chain status.
 */
export const APPROVAL_CHAIN_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
} as const;

export type ApprovalChainStatus =
  (typeof APPROVAL_CHAIN_STATUS)[keyof typeof APPROVAL_CHAIN_STATUS];
