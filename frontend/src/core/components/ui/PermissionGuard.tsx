/**
 * Renders children only when the user has the required permission.
 * Use to hide Create/Edit/Delete buttons or other UI by permission.
 */
import { ReactNode } from 'react';
import { usePermissions } from '@/core/hooks/usePermissions';
import type { PermissionName } from '@/core/lib/permissions';

interface PermissionGuardProps {
  permission: PermissionName;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();
  if (hasPermission(permission)) return <>{children}</>;
  return <>{fallback}</>;
}

interface PermissionGuardAnyProps {
  permissions: PermissionName[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuardAny({
  permissions,
  children,
  fallback = null,
}: PermissionGuardAnyProps) {
  const { hasAnyPermission } = usePermissions();
  if (hasAnyPermission(permissions)) return <>{children}</>;
  return <>{fallback}</>;
}
