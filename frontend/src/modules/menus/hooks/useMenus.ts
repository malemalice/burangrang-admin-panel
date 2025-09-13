/**
 * Menu hooks
 * Following TRD.md patterns for custom hooks
 */
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import menuService from '../services/menuService';
import { 
  Menu, 
  PaginatedResponse, 
  MenuSearchParams, 
  CreateMenuDTO, 
  UpdateMenuDTO,
  MenuStats
} from '../types/menu.types';

export const useMenus = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [totalMenus, setTotalMenus] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('useMenus hook - menus:', menus, 'isLoading:', isLoading, 'error:', error);

  const fetchMenus = async (params: MenuSearchParams) => {
    console.log('fetchMenus called with params:', params);
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Menu> = await menuService.getMenus(params);
      console.log('fetchMenus response:', response);
      setMenus(response.data || []);
      setTotalMenus(response.meta?.total || 0);
      setCurrentPage(params.page);
    } catch (err) {
      console.error('fetchMenus error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menus';
      setError(errorMessage);
      toast.error(errorMessage);
      // Set empty array on error to prevent undefined issues
      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createMenu = async (menuData: CreateMenuDTO) => {
    try {
      const newMenu = await menuService.createMenu(menuData);
      setMenus(prev => [newMenu, ...prev]);
      setTotalMenus(prev => prev + 1);
      toast.success('Menu created successfully');
      return newMenu;
    } catch (err) {
      toast.error('Failed to create menu');
      throw err;
    }
  };

  const updateMenu = async (id: string, menuData: UpdateMenuDTO) => {
    try {
      const updatedMenu = await menuService.updateMenu(id, menuData);
      setMenus(prev => prev.map(item => item.id === id ? updatedMenu : item));
      toast.success('Menu updated successfully');
      return updatedMenu;
    } catch (err) {
      toast.error('Failed to update menu');
      throw err;
    }
  };

  const deleteMenu = async (id: string) => {
    try {
      await menuService.deleteMenu(id);
      setMenus(prev => prev.filter(item => item.id !== id));
      setTotalMenus(prev => prev - 1);
      toast.success('Menu deleted successfully');
    } catch (err) {
      toast.error('Failed to delete menu');
      throw err;
    }
  };

  return {
    menus,
    totalMenus,
    currentPage,
    isLoading,
    error,
    fetchMenus,
    createMenu,
    updateMenu,
    deleteMenu,
  };
};

export const useMenu = (id: string | null = null) => {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = async (menuId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await menuService.getMenuById(menuId);
      setMenu(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMenu(id);
    }
  }, [id]);

  return {
    menu,
    isLoading,
    error,
    fetchMenu,
    setMenu,
  };
};

export const useSidebarMenus = () => {
  const [sidebarMenus, setSidebarMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSidebarMenus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await menuService.getSidebarMenus();
      setSidebarMenus(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sidebar menus';
      setError(errorMessage);
      console.error('Failed to fetch sidebar menus:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarMenus();
  }, []);

  return {
    sidebarMenus,
    isLoading,
    error,
    refetch: fetchSidebarMenus,
  };
};

export const useMenuStats = () => {
  const [stats, setStats] = useState<MenuStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await menuService.getMenuStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu stats';
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
    refetch: fetchStats,
  };
};