/**
 * Approval Entity Names Registry
 *
 * Add your domain entities here. Each key is used as the value stored in
 * m_approval.entity and throughout the approval workflow.
 *
 * Example:
 *   PURCHASE_REQUEST: 'PURCHASE_REQUEST',
 *   LEAVE_REQUEST: 'LEAVE_REQUEST',
 */
export const APPROVAL_ENTITIES = {
  // Add domain entities here, e.g.:
  // PURCHASE_REQUEST: 'PURCHASE_REQUEST',
} as const;

export type ApprovalEntityName =
  (typeof APPROVAL_ENTITIES)[keyof typeof APPROVAL_ENTITIES];

/**
 * Maps each entity name to its Prisma table name (the @@map value in schema.prisma).
 * Required by the workflow engine to look up status and createdBy via raw SQL.
 *
 * Example:
 *   [APPROVAL_ENTITIES.PURCHASE_REQUEST]: 't_purchase_requests',
 */
export const APPROVAL_ENTITY_TO_TABLE: Record<string, string> = {
  // [APPROVAL_ENTITIES.PURCHASE_REQUEST]: 't_purchase_requests',
};

/**
 * Maps each entity to the column that holds its department FK (camelCase, matches Prisma schema).
 * Set to null if the entity has no department column.
 * Used to resolve the @ENTITY_DEPARTMENT sentinel marker.
 *
 * Example:
 *   [APPROVAL_ENTITIES.PURCHASE_REQUEST]: 'departmentId',
 */
export const APPROVAL_ENTITY_TO_DEPARTMENT_COLUMN: Record<string, string | null> = {
  // [APPROVAL_ENTITIES.PURCHASE_REQUEST]: 'departmentId',
};

/**
 * Maps each entity to the statuses that mean "awaiting approval".
 * Used by ApprovalAccessService to grant read access to configured approvers.
 *
 * Example:
 *   [APPROVAL_ENTITIES.PURCHASE_REQUEST]: ['WAITING_APPROVAL'],
 */
export const ENTITY_APPROVAL_PENDING_STATUSES: Record<string, string[]> = {
  // [APPROVAL_ENTITIES.PURCHASE_REQUEST]: ['WAITING_APPROVAL'],
};
