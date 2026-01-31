/**
 * Approval Entity Names Registry (Frontend)
 * 
 * Mirrors backend APPROVAL_ENTITIES to ensure consistency.
 * These values are used when submitting approvals and must match
 * the values stored in m_approval.entity field in the database.
 * 
 * Usage:
 *   import { APPROVAL_ENTITIES } from '@/modules/master-data/constants/approval-entities';
 *   const entity = APPROVAL_ENTITIES.RISK_ASSESSMENT;
 */
export const APPROVAL_ENTITIES = {
  RISK_ASSESSMENT: 'RISK_ASSESSMENT',
  WORK_PERMIT: 'WORK_PERMIT',
  INSPECTION_ITEM: 'INSPECTION_ITEM',
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
 * Helper: Get entity name from module name
 * Converts kebab-case module name to entity name
 * 
 * @example
 * getApprovalEntityName('risk-assessment') // Returns 'RISK_ASSESSMENT'
 * getApprovalEntityName('work-permits') // Returns 'WORK_PERMIT'
 */
export function getApprovalEntityName(
  moduleName: string,
): ApprovalEntityName | string {
  // Normalize module name: risk-assessment -> RISK_ASSESSMENT
  const moduleKey = moduleName.toUpperCase().replace(/-/g, '_');
  
  // Check if explicit mapping exists
  if (moduleKey in APPROVAL_ENTITIES) {
    return APPROVAL_ENTITIES[moduleKey as keyof typeof APPROVAL_ENTITIES];
  }
  
  // Fallback: Return as-is (already normalized)
  return moduleKey;
}

