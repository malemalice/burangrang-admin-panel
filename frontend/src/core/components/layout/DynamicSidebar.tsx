/**
 * Dynamic Sidebar Component
 * Renders menu items from backend with tree hierarchy support
 * Following TRD.md patterns for component architecture
 */
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/core/lib/utils';
import { Icon } from '@/core/components/ui/icon';
import { useTheme } from '@/core/lib/theme';
import { themeColors, getContrastTextColor } from '@/core/lib/theme/colors';
import { useAppName } from '@/modules/settings/hooks/useSettings';
import { useSidebarMenus } from '@/modules/menus';
import { Menu, SidebarMenu } from '@/modules/menus/types/menu.types';
import { useIsMobile } from '@/core/hooks/useIsMobile';
import { Sheet, SheetContent } from '@/core/components/ui/sheet';

interface DynamicSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface DynamicNavItemProps {
  menu: SidebarMenu;
  isOpen: boolean;
  level?: number;
}

interface DynamicSubMenuProps {
  menu: SidebarMenu;
  isOpen: boolean;
  level?: number;
}

// Common styles for both NavItem and SubMenu
const getNavStyles = (isDark: boolean, isActive = false, textColor?: string) => {
  if (isActive) {
    return isDark
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : `bg-white/10 font-medium`;
  }

  return isDark
    ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    : `hover:bg-white/10`;
};

const DynamicNavItem = ({ menu, isOpen, level = 0 }: DynamicNavItemProps) => {
  const { isDark } = useTheme();
  const location = useLocation();
  
  // In dark mode, use light text; in light mode, use contrast text
  const textColor = isDark 
    ? 'hsl(240 4.8% 95.9%)' // Light text for dark sidebar
    : '#ffffff'; // White text for light sidebar with theme colors

  const isActive = location.pathname === menu.path;

  return (
    <NavLink
      to={menu.path || '#'}
      className={({ isActive }) => cn(
        "flex items-center text-sm py-2 px-4 rounded-md transition-all",
        getNavStyles(isDark, isActive),
        !isOpen && "justify-center px-2",
        level > 0 && "ml-4" // Add indentation for nested items
      )}
      style={{
        color: textColor,
      }}
    >
      {menu.icon && <Icon name={menu.icon} size={20} className={cn(!isOpen && "mx-auto")} />}
      {isOpen && <span className={cn(menu.icon && "ml-3")}>{menu.name}</span>}
    </NavLink>
  );
};

const DynamicSubMenu = ({ menu, isOpen, level = 0 }: DynamicSubMenuProps) => {
  const [expanded, setExpanded] = useState(false);
  const { isDark } = useTheme();
  const location = useLocation();
  
  // In dark mode, use light text; in light mode, use contrast text
  const textColor = isDark 
    ? 'hsl(240 4.8% 95.9%)' // Light text for dark sidebar
    : '#ffffff'; // White text for light sidebar with theme colors

  // Check if any child is active to determine if this submenu should be expanded
  const hasActiveChild = menu.children?.some(child => 
    child.path === location.pathname || 
    child.children?.some(grandChild => grandChild.path === location.pathname)
  );

  useEffect(() => {
    if (hasActiveChild) {
      setExpanded(true);
    }
  }, [hasActiveChild]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        className={cn(
          "flex items-center w-full text-sm py-3 px-4 rounded-md transition-all",
          getNavStyles(isDark),
          !isOpen && "justify-center px-2",
          level > 0 && "ml-4" // Add indentation for nested items
        )}
        style={{
          color: textColor,
        }}
      >
        {menu.icon && <Icon name={menu.icon} size={20} className={cn(!isOpen && "mx-auto")} />}
        {isOpen && (
          <>
            <span className="ml-3 flex-1 text-left">{menu.name}</span>
            {expanded ? <Icon name="ChevronDown" size={16} /> : <Icon name="ChevronRight" size={16} />}
          </>
        )}
      </button>
      {isOpen && expanded && (
        <div className={cn("mt-1 space-y-1", level > 0 ? "pl-4" : "pl-10")}>
          {menu.children?.map((child) => (
            <DynamicMenuItem 
              key={child.id} 
              menu={child} 
              isOpen={isOpen} 
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DynamicMenuItem = ({ menu, isOpen, level = 0 }: DynamicNavItemProps) => {
  // If menu has children, render as submenu
  if (menu.children && menu.children.length > 0) {
    return (
      <DynamicSubMenu 
        menu={menu} 
        isOpen={isOpen} 
        level={level}
      />
    );
  }

  // If menu has no children, render as nav item
  return (
    <DynamicNavItem 
      menu={menu} 
      isOpen={isOpen} 
      level={level}
    />
  );
};

// Sidebar content component to be reused in both mobile and desktop
const SidebarContent = ({ 
  isOpen, 
  currentThemeColor, 
  textColor, 
  appName, 
  isDark, 
  sidebarMenus, 
  isLoading, 
  error 
}: {
  isOpen: boolean;
  currentThemeColor: string;
  textColor: string;
  appName: string;
  isDark: boolean;
  sidebarMenus: SidebarMenu[];
  isLoading: boolean;
  error: any;
}) => {
  if (isLoading) {
    return (
      <>
        <div className={cn(
          "flex items-center justify-center h-16 border-b px-4 flex-shrink-0",
          "border-sidebar-border"
        )}>
          <h1
            className="text-xl font-bold"
            style={{ color: textColor }}
          >
            {isOpen ? appName : (appName.substring(0, Math.min(2, appName.length)).toUpperCase() || "ON")}
          </h1>
        </div>
        <div className="py-4 px-2 space-y-1 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-center h-8">
            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className={cn(
          "flex items-center justify-center h-16 border-b px-4 flex-shrink-0",
          "border-sidebar-border"
        )}>
          <h1
            className="text-xl font-bold"
            style={{ color: textColor }}
          >
            {isOpen ? appName : (appName.substring(0, Math.min(2, appName.length)).toUpperCase() || "ON")}
          </h1>
        </div>
        <div className="py-4 px-2 space-y-1 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="text-center text-sm" style={{ color: textColor }}>
            {isOpen ? "Failed to load menus" : "!"}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={cn(
        "flex items-center justify-center h-16 border-b px-4 flex-shrink-0",
        isDark ? "border-gray-800" : "border-white/10"
      )}>
        <h1
          className="text-xl font-bold"
          style={{ color: textColor }}
        >
          {isOpen ? appName : (appName.substring(0, Math.min(2, appName.length)).toUpperCase() || "ON")}
        </h1>
      </div>

      <div className="py-4 px-2 space-y-1 flex-1 overflow-y-auto overflow-x-hidden">
        {sidebarMenus.map((menu) => (
          <DynamicMenuItem 
            key={menu.id} 
            menu={menu} 
            isOpen={isOpen} 
            level={0}
          />
        ))}
      </div>
    </>
  );
};

const DynamicSidebar = ({ isOpen, onClose }: DynamicSidebarProps) => {
  const { isDark, theme } = useTheme();
  const { appName } = useAppName();
  const { sidebarMenus, isLoading, error } = useSidebarMenus();
  const isMobile = useIsMobile();

  // In dark mode, use neutral dark color; in light mode, use theme color
  const currentThemeColor = isDark 
    ? 'hsl(240 5.9% 10%)' // Dark neutral for sidebar in dark mode
    : (themeColors[theme]?.primary || '#6366f1');
  const textColor = isDark 
    ? 'hsl(240 4.8% 95.9%)' // Light text for dark sidebar
    : getContrastTextColor(currentThemeColor);

  // Mobile: Use Sheet component (overlay drawer)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-sidebar border-r [&>button]:hidden"
          style={{
            backgroundColor: currentThemeColor,
            borderColor: currentThemeColor + '30',
          }}
        >
          <div className="flex flex-col h-full">
            <SidebarContent
              isOpen={true}
              currentThemeColor={currentThemeColor}
              textColor={textColor}
              appName={appName}
              isDark={isDark}
              sidebarMenus={sidebarMenus}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use fixed sidebar
  return (
    <aside
      className={cn(
        "fixed h-full border-r shadow-sm z-20 transition-all duration-300 ease-in-out flex flex-col hidden md:flex",
        isOpen ? "w-64" : "w-20"
      )}
      style={{
        backgroundColor: currentThemeColor,
        borderColor: currentThemeColor + '30',
      }}
    >
      <SidebarContent
        isOpen={isOpen}
        currentThemeColor={currentThemeColor}
        textColor={textColor}
        appName={appName}
        isDark={isDark}
        sidebarMenus={sidebarMenus}
        isLoading={isLoading}
        error={error}
      />
    </aside>
  );
};

export default DynamicSidebar;
