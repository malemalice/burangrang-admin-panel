/**
 * Menu Context
 * Provides global menu state management
 * Following TRD.md patterns for context management
 */
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSidebarMenus } from '@/modules/menus';
import { Menu } from '@/modules/menus/types/menu.types';

/** Flattens the full menu tree into a path → display name lookup map. */
export const buildPathNameMap = (menus: Menu[]): Record<string, string> => {
  const map: Record<string, string> = {};
  const traverse = (items: Menu[]) => {
    for (const item of items) {
      if (item.path && item.path !== '#') {
        map[item.path] = item.name;
      }
      if (item.children?.length) traverse(item.children);
    }
  };
  traverse(menus);
  return map;
};

interface MenuContextType {
  menus: Menu[];
  pathNameMap: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export const MenuProvider = ({ children }: MenuProviderProps) => {
  const { sidebarMenus, isLoading, error, refetch } = useSidebarMenus();
  const pathNameMap = useMemo(() => buildPathNameMap(sidebarMenus), [sidebarMenus]);

  const value: MenuContextType = {
    menus: sidebarMenus,
    pathNameMap,
    isLoading,
    error,
    refetch,
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
};
