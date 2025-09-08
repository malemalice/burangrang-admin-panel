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
    isVisible: menuDto.isVisible,
    order: menuDto.order,
    permissions: menuDto.permissions,
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
      const response = await api.get('/menus', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching menus:', error);
      throw error;
    }
  },

  // Get menu tree structure
  getMenuTree: async (): Promise<MenuTreeNode[]> => {
    try {
      const response = await api.get('/menus/tree');
      const menus: MenuDTO[] = response.data;
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
      const response = await api.put(`/menus/${id}`, menuData);
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

  // Get menu permissions
  getMenuPermissions: async (menuId: string): Promise<string[]> => {
    try {
      const response = await api.get(`/menus/${menuId}/permissions`);
      return response.data.permissions || [];
    } catch (error) {
      console.error('Error fetching menu permissions:', error);
      return [];
    }
  },

  // Update menu permissions
  updateMenuPermissions: async (menuId: string, permissions: string[]): Promise<void> => {
    try {
      await api.put(`/menus/${menuId}/permissions`, { permissions });
    } catch (error) {
      console.error('Error updating menu permissions:', error);
      throw error;
    }
  },

  // Export menus
  exportMenus: async (): Promise<MenuDTO[]> => {
    try {
      const response = await api.get('/menus/export');
      return response.data;
    } catch (error) {
      console.error('Error exporting menus:', error);
      throw error;
    }
  },

  // Import menus
  importMenus: async (menus: MenuDTO[]): Promise<MenuDTO[]> => {
    try {
      const response = await api.post('/menus/import', { menus });
      return response.data;
    } catch (error) {
      console.error('Error importing menus:', error);
      throw error;
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
        visible: 0,
        withChildren: 0,
        byPermissionCount: [],
        topLevelMenus: 0,
        deepestLevel: 1,
        recentlyCreated: 0,
      };
    }
  },

  // Validate menu data
  validateMenu: (menuData: Partial<MenuDTO>): { isValid: boolean; errors: string[] } => {
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
