/**
 * Approval Entity constants
 * Used to identify what entity is being approved in master approvals flow.
 */
export const APPROVAL_ENTITIES = {
  AUDIT_ITEM: 'AUDIT_ITEM',
  INSPECTION_ITEM: 'INSPECTION_ITEM',
  INCIDENT: 'INCIDENT',
  COURSE: 'COURSE',
  CHAPTER: 'CHAPTER',
  PPE_WITHDRAWAL: 'PPE_WITHDRAWAL',
  ENVIRONMENTAL_MEASUREMENT: 'ENVIRONMENTAL_MEASUREMENT',
  WEIGHT_REPORT: 'WEIGHT_REPORT',
} as const;

export type ApprovalEntity = (typeof APPROVAL_ENTITIES)[keyof typeof APPROVAL_ENTITIES];

