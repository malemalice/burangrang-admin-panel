/**
 * Utility functions for normalizing audit item data
 * Handles both DTO format (with departmentIds/userIds) and raw database format (with departments/users arrays)
 */

export interface NormalizedAuditItem {
  id: string;
  auditId: string;
  auditCriteriaId: string;
  status: string;
  compliantStatus: string;
  evidence?: string;
  recommendation?: string;
  actionRealization?: string;
  order: number;
  dueDate: Date;
  departmentIds: string[];
  userIds: string[];
  images?: Array<{
    id: string;
    imageUrl: string;
    caption?: string;
    order: number;
  }>;
}

/**
 * Normalizes audit item data from API response
 * Handles both DTO format (with departmentIds/userIds) and raw database format (with departments/users arrays)
 */
export function normalizeAuditItem(item: any): NormalizedAuditItem {
  // Extract departmentIds - handle both DTO format and raw database format
  let departmentIds: string[] = [];
  if (item.departmentIds && Array.isArray(item.departmentIds) && item.departmentIds.length > 0) {
    departmentIds = item.departmentIds;
  } else if (item.departments && Array.isArray(item.departments) && item.departments.length > 0) {
    departmentIds = item.departments
      .map((d: any) => d.departmentId || d.id || d)
      .filter((id: any) => id);
  }

  // Extract userIds - handle both DTO format and raw database format
  let userIds: string[] = [];
  if (item.userIds && Array.isArray(item.userIds)) {
    userIds = item.userIds;
  } else if (item.users && Array.isArray(item.users)) {
    userIds = item.users
      .map((u: any) => u.userId || u.id)
      .filter((id: any) => id);
  }

  return {
    ...item,
    departmentIds,
    userIds,
  } as NormalizedAuditItem;
}

/**
 * Normalizes an array of audit items from API response
 */
export function normalizeAuditItems(items: any[]): NormalizedAuditItem[] {
  return items.map((item) => normalizeAuditItem(item));
}
