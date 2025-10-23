/**
 * Users module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as UsersPage } from './pages/UsersPage';
export { default as CreateUserPage } from './pages/CreateUserPage';
export { default as EditUserPage } from './pages/EditUserPage';
export { default as UserDetailPage } from './pages/UserDetailPage';
export { default as UserForm } from './pages/UserForm';

// Routes
export { default as userRoutes } from './routes/userRoutes';

// Services
export { default as userService } from './services/userService';

// Types
export type {
  User,
  UserDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserFormData,
  UserFilters,
  UserSearchParams,
  UserStats,
  PaginatedResponse,
  PaginationParams,
} from './types/user.types';

// Hooks
export { useUsers, useUser, useUserStats } from './hooks/useUsers';
