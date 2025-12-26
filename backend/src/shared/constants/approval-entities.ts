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
  // Add more entities as modules are added
  // CERTIFICATE: 'Certificate',
  // PPE_WITHDRAWAL: 'PPEWithdrawal',
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
 * getApprovalEntityName('work-permits') // Returns 'WORK_PERMIT'
 * getApprovalEntityName('risk-assessment') // Returns 'RiskAssessment'
 */
export function getApprovalEntityName(
  moduleName: string,
): ApprovalEntityName | string {
  // Normalize module name: work-permits -> WORK_PERMITS
  const moduleKey = moduleName.toUpperCase().replace(/-/g, '_');

  // Check if explicit mapping exists
  if (moduleKey in APPROVAL_ENTITIES) {
    return APPROVAL_ENTITIES[moduleKey as keyof typeof APPROVAL_ENTITIES];
  }

  // Fallback: Convert to PascalCase
  // work-permits -> WorkPermits
  return moduleName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
