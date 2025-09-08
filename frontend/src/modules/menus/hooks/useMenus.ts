import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import menuService from '../services/menuService';
import {
  MenuDTO,
  MenuTreeNode,
  MenuSearchParams,
  CreateMenuDTO,
  UpdateMenuDTO,
  MenuStats
} from '../types/menu.types';

/**
 * Custom hook for managing menus
 */
export const useMenus = () => {
  const [menus, setMenus] = useState<MenuDTO[]>([]);
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [totalMenus, setTotalMenus] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch menus with pagination and filters
  const fetchMenus = async (params: MenuSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await menuService.getMenus(params);
      setMenus(response.data);
      setTotalMenus(response.meta.total);
      setCurrentPage(params.page);

      // Build menu tree
      const tree = menuService.buildMenuTree(response.data);
      setMenuTree(tree);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menus';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch menu tree structure
  const fetchMenuTree = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tree = await menuService.getMenuTree();
      setMenuTree(tree);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu tree';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new menu item
  const createMenu = async (menuData: CreateMenuDTO) => {
    try {
      // Validate menu data
      const validation = menuService.validateMenu(menuData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const newMenu = await menuService.createMenu(menuData);
      setMenus(prev => [newMenu, ...prev]);
      setTotalMenus(prev => prev + 1);

      // Rebuild tree
      const updatedMenus = [newMenu, ...menus];
      const tree = menuService.buildMenuTree(updatedMenus);
      setMenuTree(tree);

      toast.success('Menu item created successfully');
      return newMenu;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create menu item';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing menu item
  const updateMenu = async (id: string, menuData: UpdateMenuDTO) => {
    try {
      // Validate menu data
      const validation = menuService.validateMenu(menuData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const updatedMenu = await menuService.updateMenu(id, menuData);
      setMenus(prev => prev.map(menu => menu.id === id ? updatedMenu : menu));

      // Rebuild tree
      const updatedMenus = menus.map(menu => menu.id === id ? updatedMenu : menu);
      const tree = menuService.buildMenuTree(updatedMenus);
      setMenuTree(tree);

      toast.success('Menu item updated successfully');
      return updatedMenu;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update menu item';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a menu item
  const deleteMenu = async (id: string) => {
    try {
      await menuService.deleteMenu(id);
      setMenus(prev => prev.filter(menu => menu.id !== id));
      setTotalMenus(prev => prev - 1);

      // Rebuild tree
      const updatedMenus = menus.filter(menu => menu.id !== id);
      const tree = menuService.buildMenuTree(updatedMenus);
      setMenuTree(tree);

      toast.success('Menu item deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete menu item';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update menu order
  const updateMenuOrder = async (menuOrders: Array<{ id: string; order: number }>) => {
    try {
      await menuService.updateMenuOrder(menuOrders);

      // Refresh menu tree
      await fetchMenuTree();

      toast.success('Menu order updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update menu order';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    menus,
    menuTree,
    totalMenus,
    currentPage,
    isLoading,
    error,
    fetchMenus,
    fetchMenuTree,
    createMenu,
    updateMenu,
    deleteMenu,
    updateMenuOrder,
  };
};

/**
 * Custom hook for managing a single menu
 */
export const useMenu = (menuId: string | null = null) => {
  const [menu, setMenu] = useState<MenuDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a single menu by ID
  const fetchMenu = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const menuData = await menuService.getMenuById(id);
      setMenu(menuData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load menu on mount if menuId is provided
  useEffect(() => {
    if (menuId) {
      fetchMenu(menuId);
    }
  }, [menuId]);

  return {
    menu,
    isLoading,
    error,
    fetchMenu,
    setMenu,
  };
};

/**
 * Custom hook for menu statistics
 */
export const useMenuStats = () => {
  const [stats, setStats] = useState<MenuStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const menuStats = await menuService.getMenuStats();
      setStats(menuStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu statistics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};

/**
 * Custom hook for menu permissions
 */
export const useMenuPermissions = (menuId: string | null = null) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch permissions for a menu
  const fetchPermissions = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const permissionData = await menuService.getMenuPermissions(id);
      setPermissions(permissionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu permissions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update permissions for a menu
  const updatePermissions = async (id: string, newPermissions: string[]) => {
    try {
      await menuService.updateMenuPermissions(id, newPermissions);
      setPermissions(newPermissions);
      toast.success('Menu permissions updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update menu permissions';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Load permissions on mount if menuId is provided
  useEffect(() => {
    if (menuId) {
      fetchPermissions(menuId);
    }
  }, [menuId]);

  return {
    permissions,
    isLoading,
    error,
    fetchPermissions,
    updatePermissions,
    setPermissions,
  };
};
