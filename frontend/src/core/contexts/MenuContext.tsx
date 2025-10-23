/**
 * Menu Context
 * Provides global menu state management
 * Following TRD.md patterns for context management
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useSidebarMenus } from '@/modules/menus';
import { Menu } from '@/modules/menus/types/menu.types';

interface MenuContextType {
  menus: Menu[];
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

  const value: MenuContextType = {
    menus: sidebarMenus,
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
