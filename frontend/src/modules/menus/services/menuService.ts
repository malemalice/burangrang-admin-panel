/**
 * Menu service
 * Following TRD.md patterns for service layer architecture
 */
import api from '@/core/lib/api';
import { 
  MenuDTO, 
  Menu, 
  CreateMenuDTO, 
  UpdateMenuDTO, 
  PaginatedResponse, 
  PaginationParams,
  MenuSearchParams,
  MenuStats
} from '../types/menu.types';

// Data transformation functions
const mapMenuDtoToMenu = (menuDto: MenuDTO): Menu => ({
  id: menuDto.id,
  name: menuDto.name,
  path: menuDto.path,
  icon: menuDto.icon,
  parentId: menuDto.parentId,
  parent: menuDto.parent ? mapMenuDtoToMenu(menuDto.parent) : null,
  children: menuDto.children ? menuDto.children.map(child => mapMenuDtoToMenu(child as MenuDTO)) : [],
  order: menuDto.order,
  isActive: menuDto.isActive,
  roles: menuDto.roles ? menuDto.roles.map(role => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    createdAt: new Date(role.createdAt).toISOString(),
    updatedAt: new Date(role.updatedAt).toISOString(),
  })) : [],
  createdAt: new Date(menuDto.createdAt).toISOString(),
  updatedAt: new Date(menuDto.updatedAt).toISOString(),
});

const mapMenuToCreateDto = (menu: Partial<Menu>): CreateMenuDTO => ({
  name: menu.name || '',
  path: menu.path || undefined,
  icon: menu.icon || undefined,
  parentId: menu.parentId || undefined,
  order: menu.order || 0,
  isActive: menu.isActive ?? true,
  roleIds: menu.roles?.map(role => role.id) || [],
});

const mapMenuToUpdateDto = (menu: Partial<Menu>): UpdateMenuDTO => ({
  name: menu.name,
  path: menu.path,
  icon: menu.icon,
  parentId: menu.parentId,
  order: menu.order,
  isActive: menu.isActive,
  roleIds: menu.roles?.map(role => role.id),
});

const menuService = {
  // GET all with pagination
  getMenus: async (params: PaginationParams): Promise<PaginatedResponse<Menu>> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString()
    });

    // Add search and filters
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/menus?${queryParams.toString()}`);
    return {
      data: response.data.data ? response.data.data.map(mapMenuDtoToMenu) : [],
      meta: response.data.meta || { total: 0, page: 1, limit: 10, totalPages: 0 }
    };
  },

  // GET single menu
  getMenuById: async (id: string): Promise<Menu> => {
    const response = await api.get(`/menus/${id}`);
    return mapMenuDtoToMenu(response.data);
  },

  // GET menu hierarchy
  getMenuHierarchy: async (): Promise<Menu[]> => {
    const response = await api.get('/menus/hierarchy');
    return response.data.map(mapMenuDtoToMenu);
  },

  // GET sidebar menus (active menus only)
  getSidebarMenus: async (): Promise<Menu[]> => {
    const response = await api.get('/menus/sidebar');
    return response.data.map(mapMenuDtoToMenu);
  },

  // GET menus by role
  getMenusByRole: async (roleId: string): Promise<Menu[]> => {
    const response = await api.get(`/menus/role/${roleId}`);
    return response.data.map(mapMenuDtoToMenu);
  },

  // CREATE menu
  createMenu: async (menuData: CreateMenuDTO): Promise<Menu> => {
    const response = await api.post('/menus', menuData);
    return mapMenuDtoToMenu(response.data);
  },

  // UPDATE menu
  updateMenu: async (id: string, menuData: UpdateMenuDTO): Promise<Menu> => {
    const response = await api.patch(`/menus/${id}`, menuData);
    return mapMenuDtoToMenu(response.data);
  },

  // DELETE menu
  deleteMenu: async (id: string): Promise<void> => {
    await api.delete(`/menus/${id}`);
  },

  // UPDATE menu order
  updateMenuOrder: async (menuOrders: Array<{ id: string; order: number }>): Promise<void> => {
    await api.put('/menus/order', { menuOrders });
  },

  // GET menu statistics
  getMenuStats: async (): Promise<MenuStats> => {
    const response = await api.get('/menus/stats');
    return response.data;
  },
};

export default menuService;