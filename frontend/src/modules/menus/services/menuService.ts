import api from '@/core/lib/api';
import {
  MenuDTO,
  CreateMenuDTO,
  UpdateMenuDTO,
  MenuTreeNode,
  MenuSearchParams,
  PaginatedResponse,
  PaginationParams
} from '../types/menu.types';

// Convert MenuDTO from backend to MenuTreeNode for frontend
const mapMenuDtoToMenuTreeNode = (menuDto: MenuDTO): MenuTreeNode => {
  return {
    id: menuDto.id,
    name: menuDto.name,
    path: menuDto.path,
    icon: menuDto.icon,
    children: menuDto.children?.map(mapMenuDtoToMenuTreeNode) || [],
    level: 0, // Will be set when building tree
    isExpanded: false,
    isActive: menuDto.isActive,
    order: menuDto.order,
    roles: menuDto.roles || [],
  };
};

// Build hierarchical menu tree
const buildMenuTree = (menuItems: MenuDTO[]): MenuTreeNode[] => {
  const itemMap = new Map<string, MenuTreeNode>();
  const rootItems: MenuTreeNode[] = [];

  // First pass: create all nodes
  menuItems.forEach(item => {
    const node: MenuTreeNode = mapMenuDtoToMenuTreeNode(item);
    itemMap.set(item.id, node);
  });

  // Second pass: build hierarchy
  menuItems.forEach(item => {
    const node = itemMap.get(item.id)!;
    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(node);
        node.level = parent.level + 1;
      } else {
        rootItems.push(node);
      }
    } else {
      rootItems.push(node);
    }
  });

  // Sort by order
  const sortByOrder = (items: MenuTreeNode[]) => {
    items.sort((a, b) => a.order - b.order);
    items.forEach(item => {
      if (item.children.length > 0) {
        sortByOrder(item.children);
      }
    });
  };

  sortByOrder(rootItems);
  return rootItems;
};

const menuService = {
  // Get all menus with pagination and filters
  getMenus: async (params?: MenuSearchParams): Promise<PaginatedResponse<MenuDTO>> => {
    try {
      const queryParams = new URLSearchParams();

      // Add pagination parameters
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      // Add sorting if provided
      if (params?.sortBy) {
        queryParams.append('sortBy', params.sortBy);
        queryParams.append('sortOrder', params.sortOrder || 'asc');
      }

      // Add search if provided
      if (params?.search) {
        queryParams.append('search', params.search);
      }

      // Add filters if provided
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const queryString = queryParams.toString();
      const url = queryString ? `/menus?${queryString}` : '/menus';

      const response = await api.get(url);
      return {
        data: response.data?.data || [],
        meta: response.data?.meta || { total: 0, page: 1, limit: 10 }
      };
    } catch (error) {
      console.error('Error fetching menus:', error);
      // Return empty data structure on error
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10 }
      };
    }
  },

  // Get menu tree structure
  getMenuTree: async (): Promise<MenuTreeNode[]> => {
    try {
      const response = await api.get('/menus/hierarchy');
      const menus: MenuDTO[] = response.data || [];
      return buildMenuTree(menus);
    } catch (error) {
      console.error('Error fetching menu tree:', error);
      // Return empty tree if API fails
      return [];
    }
  },

  // Get menu by ID
  getMenuById: async (id: string): Promise<MenuDTO> => {
    try {
      const response = await api.get(`/menus/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching menu by ID:', error);
      throw error;
    }
  },

  // Create new menu
  createMenu: async (menuData: CreateMenuDTO): Promise<MenuDTO> => {
    try {
      const response = await api.post('/menus', menuData);
      return response.data;
    } catch (error) {
      console.error('Error creating menu:', error);
      throw error;
    }
  },

  // Update existing menu
  updateMenu: async (id: string, menuData: UpdateMenuDTO): Promise<MenuDTO> => {
    try {
      const response = await api.patch(`/menus/${id}`, menuData);
      return response.data;
    } catch (error) {
      console.error('Error updating menu:', error);
      throw error;
    }
  },

  // Delete menu
  deleteMenu: async (id: string): Promise<void> => {
    try {
      await api.delete(`/menus/${id}`);
    } catch (error) {
      console.error('Error deleting menu:', error);
      throw error;
    }
  },

  // Bulk update menu orders
  updateMenuOrder: async (menuOrders: Array<{ id: string; order: number }>): Promise<void> => {
    try {
      await api.put('/menus/order', { menuOrders });
    } catch (error) {
      console.error('Error updating menu order:', error);
      throw error;
    }
  },



  // Get menus by role
  getMenusByRole: async (roleId: string): Promise<MenuDTO[]> => {
    try {
      const response = await api.get(`/menus/role/${roleId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching menus by role:', error);
      return [];
    }
  },

  // Get menu statistics
  getMenuStats: async () => {
    try {
      const response = await api.get('/menus/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching menu statistics:', error);
      // Return default stats if API fails
      return {
        total: 0,
        active: 0,
        withChildren: 0,
        byPermissionCount: [],
        topLevelMenus: 0,
        deepestLevel: 1,
        recentlyCreated: 0,
      };
    }
  },

  // Validate menu data
  validateMenu: (menuData: Partial<CreateMenuDTO | UpdateMenuDTO>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!menuData.name?.trim()) {
      errors.push('Menu name is required');
    }

    if (menuData.path && !menuData.path.startsWith('/')) {
      errors.push('Menu path must start with /');
    }

    if (menuData.order !== undefined && (menuData.order < 0 || menuData.order > 999)) {
      errors.push('Menu order must be between 0 and 999');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Utility functions
  buildMenuTree,
  mapMenuDtoToMenuTreeNode,
};

export default menuService;
