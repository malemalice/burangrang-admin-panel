/**
 * Approval Entity constants
 * Add your domain entities here — they must match the keys in the backend's APPROVAL_ENTITIES.
 *
 * Example:
 *   PURCHASE_REQUEST: 'PURCHASE_REQUEST',
 *   LEAVE_REQUEST: 'LEAVE_REQUEST',
 */
export const APPROVAL_ENTITIES = {
  // Add domain entities here, e.g.:
  // PURCHASE_REQUEST: 'PURCHASE_REQUEST',
} as const;

export type ApprovalEntity = (typeof APPROVAL_ENTITIES)[keyof typeof APPROVAL_ENTITIES];
