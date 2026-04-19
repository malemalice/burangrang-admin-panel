/**
 * Data level for row-level access. Used by DataScopeService and data-scoped modules.
 * SELF: user sees only rows they "own" (e.g. createdBy, assigneeId, userId).
 * DEPARTMENT: user sees rows in their department.
 * SUPER: user sees all rows (no extra filter).
 */
export type DataLevel = 'SELF' | 'DEPARTMENT' | 'SUPER';

/**
 * Request-scoped context set by DataScopeGuard on routes that need data-level filtering.
 * Only present on the four data-scoped modules: enrollments, work-permits, certificates, PPE withdrawals.
 */
export interface UserContext {
  userId: string;
  roleId: string;
  roleName: string;
  dataLevel: DataLevel;
  departmentId: string | null;
  jobPositionId: string | null;
  /** Contractor / vendor tenancy; null = internal BSJ scope per product rules */
  companyId: string | null;
}
