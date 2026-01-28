/**
 * Approval Field Markers
 * 
 * Sentinel values used to indicate dynamic field resolution in master approval items.
 * Instead of storing fixed department/job position IDs, these markers indicate that
 * the values should be resolved from the entity's own data at approval creation time.
 * 
 * @example
 * // Dynamic: Use department from risk assessment entity
 * departmentId: APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT
 * 
 * // Dynamic: Find department head in the entity's department
 * jobPositionId: APPROVAL_FIELD_MARKERS.FROM_ENTITY_JOB_POSITION
 */
export const APPROVAL_FIELD_MARKERS = {
  /**
   * Indicates department should be resolved from the entity's departmentId field
   * Example: For Risk Assessment, use riskAssessment.departmentId
   */
  FROM_ENTITY_DEPARTMENT: '@ENTITY_DEPARTMENT',
  
  /**
   * Indicates job position should be resolved from entity data
   * Currently resolves to department head in the entity's department
   * Requires additional logic to determine which job position (e.g., department head)
   */
  FROM_ENTITY_JOB_POSITION: '@ENTITY_JOB_POSITION',
} as const;

export type ApprovalFieldMarker = typeof APPROVAL_FIELD_MARKERS[keyof typeof APPROVAL_FIELD_MARKERS];

/**
 * Check if a value is a sentinel marker
 */
export function isApprovalFieldMarker(value: string): value is ApprovalFieldMarker {
  return Object.values(APPROVAL_FIELD_MARKERS).includes(value as ApprovalFieldMarker);
}
