/**
 * Roles module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as RolesPage } from './pages/RolesPage';
export { default as CreateRolePage } from './pages/CreateRolePage';
export { default as EditRolePage } from './pages/EditRolePage';
export { default as RoleDetailPage } from './pages/RoleDetailPage';

// Routes
export { default as roleRoutes } from './routes/roleRoutes';

// Services
export { default as roleService } from './services/roleService';

// Types
export type {
  Role,
  Permission,
  RoleDTO,
  PermissionDTO,
  CreateRoleDTO,
  UpdateRoleDTO,
  RoleFormData,
  RoleFilters,
  RoleSearchParams,
  RoleStats,
  RoleAssignment,
  PermissionGroup,
  PermissionCategory,
  PaginatedResponse,
  PaginationParams,
} from './types/role.types';

// Hooks
export { useRoles, useRole, usePermissions, useRoleStats } from './hooks/useRoles';
