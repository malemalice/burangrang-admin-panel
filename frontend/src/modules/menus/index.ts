/**
 * Menus module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as MenusPage } from './pages/MenusPage';
export { default as CreateMenuPage } from './pages/CreateMenuPage';
export { default as EditMenuPage } from './pages/EditMenuPage';
export { default as MenuDetailPage } from './pages/MenuDetailPage';

// Components
export { default as MenuForm } from './components/MenuForm';

// Routes
export { default as menuRoutes } from './routes/menuRoutes';

// Services
export { default as menuService } from './services/menuService';

// Types
export type {
  MenuDTO,
  CreateMenuDTO,
  UpdateMenuDTO,
  MenuFormData,
  MenuFilters,
  MenuSearchParams,
  MenuTreeNode,
  MenuStats,
  MenuPermissionAssignment,
  MenuCategory,
  BreadcrumbItem,
  MenuAccessControl,
  MenuValidationRules,
  MenuImportData,
  MenuExportData,
  MenuItem,
  PaginatedResponse,
  PaginationParams,
} from './types/menu.types';

// Hooks
export {
  useMenus,
  useMenu,
  useMenuStats,
  useMenuPermissions,
} from './hooks/useMenus';
