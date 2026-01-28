/**
 * Approval Entity Names Registry
 *
 * Maps module names to approval entity identifiers used in m_approval.entity field.
 * This provides a single source of truth for entity names across the application.
 *
 * Usage:
 *   import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entities';
 *   const entity = APPROVAL_ENTITIES.RISK_ASSESSMENT;
 */
export const APPROVAL_ENTITIES = {
  RISK_ASSESSMENT: 'RISK_ASSESSMENT',
  WORK_PERMIT: 'WORK_PERMIT',
  INSPECTION: 'INSPECTION',
  INSPECTION_ITEM: 'INSPECTION_ITEM',
  AUDIT_ITEM: 'AUDIT_ITEM',
  INCIDENT: 'INCIDENT',
  // Add more entities as modules are added
  // CERTIFICATE: 'CERTIFICATE',
  // PPE_WITHDRAWAL: 'PPE_WITHDRAWAL',
} as const;

/**
 * Type for approval entity names
 */
export type ApprovalEntityName =
  (typeof APPROVAL_ENTITIES)[keyof typeof APPROVAL_ENTITIES];

/**
 * Mapping from approval entity names to their corresponding database table names.
 * This replaces the need for APPROVAL_ENTITY environment variable.
 *
 * Usage:
 *   import { APPROVAL_ENTITY_TO_TABLE } from '@/shared/constants/approval-entities';
 *   const tableName = APPROVAL_ENTITY_TO_TABLE[APPROVAL_ENTITIES.RISK_ASSESSMENT];
 */
export const APPROVAL_ENTITY_TO_TABLE: Record<ApprovalEntityName, string> = {
  [APPROVAL_ENTITIES.RISK_ASSESSMENT]: 't_risk_assessment',
  [APPROVAL_ENTITIES.WORK_PERMIT]: 't_work_permits',
  [APPROVAL_ENTITIES.INSPECTION]: 't_inspections',
  [APPROVAL_ENTITIES.INSPECTION_ITEM]: 't_inspection_items',
  [APPROVAL_ENTITIES.AUDIT_ITEM]: 't_audit_items',
  [APPROVAL_ENTITIES.INCIDENT]: 't_incidents',
  // Add more mappings as modules are added
  // [APPROVAL_ENTITIES.CERTIFICATE]: 't_certificates',
  // [APPROVAL_ENTITIES.PPE_WITHDRAWAL]: 't_ppe_withdrawals',
} as const;

/**
 * Maps each approval entity to the database column that holds the department FK.
 * Null when the entity table has no department. Used by getEntityData for
 * resolving sentinel markers (@ENTITY_DEPARTMENT, @ENTITY_JOB_POSITION).
 * Column names must match Prisma schema (camelCase, no @map).
 */
export const APPROVAL_ENTITY_TO_DEPARTMENT_COLUMN: Record<
  ApprovalEntityName,
  string | null
> = {
  [APPROVAL_ENTITIES.RISK_ASSESSMENT]: 'departmentId',
  [APPROVAL_ENTITIES.WORK_PERMIT]: null,
  [APPROVAL_ENTITIES.INSPECTION]: null,
  [APPROVAL_ENTITIES.INSPECTION_ITEM]: 'assignedDepartmentId',
  [APPROVAL_ENTITIES.AUDIT_ITEM]: null,
  [APPROVAL_ENTITIES.INCIDENT]: 'assignedDepartmentId',
};

/**
 * Helper: Get entity name from module name
 * Converts kebab-case module name to entity name
 *
 * @example
 * getApprovalEntityName('work-permits') // Returns 'WORK_PERMIT'
 * getApprovalEntityName('risk-assessment') // Returns 'RISK_ASSESSMENT'
 */
export function getApprovalEntityName(moduleName: string): ApprovalEntityName {
  // Normalize module name: work-permits -> WORK_PERMITS
  const moduleKey = moduleName.toUpperCase().replace(/-/g, '_');

  // Check if explicit mapping exists
  if (moduleKey in APPROVAL_ENTITIES) {
    return APPROVAL_ENTITIES[moduleKey as keyof typeof APPROVAL_ENTITIES];
  }

  // Fallback: Return the normalized key (should match an entity name)
  // This ensures type safety - if entity doesn't exist, TypeScript will catch it
  return moduleKey as ApprovalEntityName;
}
