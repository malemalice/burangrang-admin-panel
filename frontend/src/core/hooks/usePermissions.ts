/**
 * Hook to check user permissions for CRUD and feature access.
 * Use with permissions from AuthContext (e.g. user:create, risk-assessment:delete).
 */
import { useMemo } from 'react';
import { useAuth } from '@/core/lib/auth';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  type PermissionName,
} from '@/core/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const permissions: PermissionName[] = useMemo(
    () => (Array.isArray(user?.permissions) ? user.permissions : []),
    [user?.permissions]
  );

  return useMemo(
    () => ({
      permissions,
      hasPermission: (name: PermissionName) => hasPermission(permissions, name),
      hasAnyPermission: (names: PermissionName[]) =>
        hasAnyPermission(permissions, names),
      hasAllPermissions: (names: PermissionName[]) =>
        hasAllPermissions(permissions, names),
    }),
    [permissions]
  );
}
