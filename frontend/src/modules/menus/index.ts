/**
 * Menus module barrel exports
 * Following TRD.md module structure template
 */

// Pages
export { default as MenusPage } from './pages/MenusPage';
export { default as CreateMenuPage } from './pages/CreateMenuPage';
export { default as EditMenuPage } from './pages/EditMenuPage';
export { default as MenuDetailPage } from './pages/MenuDetailPage';

// Routes
export { default as menuRoutes } from './routes/menuRoutes';

// Services
export { default as menuService } from './services/menuService';

// Types
export type {
  Menu,
  MenuDTO,
  Role,
  RoleDTO,
  CreateMenuDTO,
  UpdateMenuDTO,
  MenuFormData,
  MenuFilters,
  MenuSearchParams,
  SidebarMenu,
  IconMapping,
  MenuStats,
  PaginatedResponse,
  PaginationParams,
} from './types/menu.types';

// Hooks
export {
  useMenus,
  useMenu,
  useSidebarMenus,
  useMenuStats,
} from './hooks/useMenus';