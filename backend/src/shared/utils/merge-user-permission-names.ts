/**
 * Merge role-assigned and direct user permissions (same union as PermissionsGuard).
 */
export function mergeRoleAndDirectPermissionNames(
  rolePermissions: { name: string }[] | undefined,
  directPermissions: { name: string }[] | undefined,
): string[] {
  const names = new Set<string>();
  for (const p of rolePermissions ?? []) {
    names.add(p.name);
  }
  for (const p of directPermissions ?? []) {
    names.add(p.name);
  }
  return Array.from(names);
}
