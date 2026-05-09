/**
 * Permission utilities - aligns with backend permissions.seed.ts (module:action)
 */

/** Permission name format: "module:action" e.g. "user:create", "risk-assessment:list" */
export type PermissionName = string;

/**
 * Check if the user has the given permission.
 * Super Admin is treated as having all permissions (backend may not list them all).
 */
export function hasPermission(
  userPermissions: PermissionName[] | undefined,
  required: PermissionName
): boolean {
  if (!userPermissions) return false;
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(required);
}

/**
 * Check if the user has any of the given permissions.
 */
export function hasAnyPermission(
  userPermissions: PermissionName[] | undefined,
  required: PermissionName[]
): boolean {
  if (!userPermissions) return false;
  if (userPermissions.includes('*')) return true;
  return required.some((p) => userPermissions.includes(p));
}

/**
 * Check if the user has all of the given permissions.
 */
export function hasAllPermissions(
  userPermissions: PermissionName[] | undefined,
  required: PermissionName[]
): boolean {
  if (!userPermissions) return false;
  if (userPermissions.includes('*')) return true;
  return required.every((p) => userPermissions.includes(p));
}
