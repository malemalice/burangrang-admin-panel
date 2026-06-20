/**
 * Dynamic Sidebar Component
 * Renders menu items from backend with tree hierarchy support
 * Following TRD.md patterns for component architecture
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/core/lib/utils';
import { Icon } from '@/core/components/ui/icon';
import { useTheme } from '@/core/lib/theme';
import { themeColors, getContrastTextColor } from '@/core/lib/theme/colors';
import { useAppBranding } from '@/modules/settings/hooks/useSettings';
import { useSidebarMenus } from '@/modules/menus';
import { SidebarMenu } from '@/modules/menus/types/menu.types';
import { useIsMobile } from '@/core/hooks/useIsMobile';
import { Sheet, SheetContent } from '@/core/components/ui/sheet';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import { Popover, PopoverAnchor, PopoverContent } from '@/core/components/ui/popover';

export interface SidebarTheme {
  currentThemeColor: string;
  textColor: string;
  isDark: boolean;
}

interface DynamicSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface DynamicNavItemProps {
  menu: SidebarMenu;
  isOpen: boolean;
  level?: number;
  sidebarTheme?: SidebarTheme;
}

interface DynamicSubMenuProps {
  menu: SidebarMenu;
  isOpen: boolean;
  level?: number;
  sidebarTheme?: SidebarTheme;
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

// Identical sizing for all collapsed items (leaf and parent) so spacing is consistent
// min-h-0 so native button min-height does not override grid row height
const COLLAPSED_ITEM_CLASS =
  "flex items-center justify-center w-full h-full min-h-0 text-sm py-2 px-2 rounded-md transition-all";

// Wrapper for collapsed items so they stay inside grid cell and center content
const COLLAPSED_WRAPPER_CLASS = "h-full flex items-center justify-center min-h-0";
// Inner wrapper so parent (button) vs leaf (span/NavLink) have identical hit area and spacing
const COLLAPSED_INNER_CLASS = "h-full w-full flex items-center justify-center min-h-0 min-w-0";

const DynamicNavItem = ({ menu, isOpen, level = 0 }: DynamicNavItemProps) => {
  const { isDark } = useTheme();
  
  // In dark mode, use light text; in light mode, use contrast text
  const textColor = isDark 
    ? 'hsl(240 4.8% 95.9%)' // Light text for dark sidebar
    : '#ffffff'; // White text for light sidebar with theme colors

  const expandedItemClass = (isActive = false) => cn(
    "flex items-center text-sm py-2 px-4 rounded-md transition-all",
    getNavStyles(isDark, isActive),
    level > 0 && "ml-4"
  );

  // Parent menus with no path (e.g. "Waste Management" when user has no child access)
  // must not be rendered as NavLink to="#" — that can match current route and stay highlighted.
  const hasValidPath = menu.path && menu.path !== '#';
  if (!hasValidPath) {
    const spanEl = (
      <span
        className={cn(
          isOpen ? expandedItemClass(false) : cn(COLLAPSED_ITEM_CLASS, getNavStyles(isDark, false)),
          "cursor-default"
        )}
        style={{ color: textColor }}
      >
        {menu.icon && <Icon name={menu.icon} size={20} className={cn(!isOpen && "mx-auto")} />}
        {isOpen && <span className={cn(menu.icon && "ml-3")}>{menu.name}</span>}
      </span>
    );
    if (!isOpen) {
      return (
        <div className={COLLAPSED_WRAPPER_CLASS}>
          <div className={COLLAPSED_INNER_CLASS}>
            <Tooltip>
              <TooltipTrigger asChild>{spanEl}</TooltipTrigger>
              <TooltipContent side="right">{menu.name}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      );
    }
    return spanEl;
  }

  const linkEl = (
    <NavLink
      to={menu.path}
      end // Use exact matching to avoid parent routes being highlighted
      className={({ isActive: linkActive }) =>
        isOpen
          ? expandedItemClass(linkActive)
          : cn(COLLAPSED_ITEM_CLASS, getNavStyles(isDark, linkActive))
      }
      style={{ color: textColor }}
    >
      {menu.icon && <Icon name={menu.icon} size={20} className={cn(!isOpen && "mx-auto")} />}
      {isOpen && <span className={cn(menu.icon && "ml-3")}>{menu.name}</span>}
    </NavLink>
  );
  if (!isOpen) {
    return (
      <div className={COLLAPSED_WRAPPER_CLASS}>
        <div className={COLLAPSED_INNER_CLASS}>
          <Tooltip>
            <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
            <TooltipContent side="right">{menu.name}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }
  return linkEl;
};

const FLYOUT_CLOSE_DELAY_MS = 150;

const DynamicSubMenu = ({ menu, isOpen, level = 0, sidebarTheme }: DynamicSubMenuProps) => {
  const [expanded, setExpanded] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => setFlyoutOpen(false), FLYOUT_CLOSE_DELAY_MS);
  }, [clearCloseTimeout]);

  useEffect(() => {
    return () => clearCloseTimeout();
  }, [clearCloseTimeout]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const triggerButton = (
    <button
      onClick={isOpen ? handleToggle : undefined}
      onMouseEnter={!isOpen ? () => { clearCloseTimeout(); setFlyoutOpen(true); } : undefined}
      onMouseLeave={!isOpen ? scheduleClose : undefined}
      className={cn(
        isOpen
          ? "flex items-center w-full text-sm py-3 px-4 rounded-md transition-all"
          : COLLAPSED_ITEM_CLASS,
        getNavStyles(isDark),
        level > 0 && "ml-4" // Add indentation for nested items
      )}
      style={{ color: textColor }}
    >
      {menu.icon && <Icon name={menu.icon} size={20} className={cn(!isOpen && "mx-auto")} />}
      {isOpen && (
        <>
          <span className="ml-3 flex-1 text-left">{menu.name}</span>
          {expanded ? <Icon name="ChevronDown" size={16} /> : <Icon name="ChevronRight" size={16} />}
        </>
      )}
    </button>
  );

  // Collapsed: show tooltip + hover flyout with children
  if (!isOpen) {
    const theme = sidebarTheme ?? { currentThemeColor: isDark ? 'hsl(240 5.9% 10%)' : '#6366f1', textColor, isDark };
    return (
      <div className={COLLAPSED_WRAPPER_CLASS}>
        <div className={COLLAPSED_INNER_CLASS}>
          <Popover open={flyoutOpen} onOpenChange={setFlyoutOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverAnchor asChild>{triggerButton}</PopoverAnchor>
              </TooltipTrigger>
              <TooltipContent side="right">{menu.name}</TooltipContent>
            </Tooltip>
            <PopoverContent
            side="right"
            align="start"
            sideOffset={4}
            className="min-w-[200px] p-2 border shadow-md"
            style={{
              backgroundColor: theme.currentThemeColor,
              color: theme.textColor,
              borderColor: theme.currentThemeColor + '30',
            }}
            onMouseEnter={() => { clearCloseTimeout(); setFlyoutOpen(true); }}
            onMouseLeave={scheduleClose}
            role="menu"
            aria-label={menu.name}
          >
            <div className="space-y-1">
              {menu.children?.map((child) => (
                <DynamicMenuItem
                  key={child.id}
                  menu={child}
                  isOpen={true}
                  level={0}
                  sidebarTheme={theme}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        </div>
      </div>
    );
  }

  // Expanded: inline toggle + children
  return (
    <div>
      {triggerButton}
      {expanded && (
        <div className={cn("mt-1 space-y-1", level > 0 ? "pl-4" : "pl-10")}>
          {menu.children?.map((child) => (
            <DynamicMenuItem 
              key={child.id} 
              menu={child} 
              isOpen={isOpen} 
              level={level + 1}
              sidebarTheme={sidebarTheme}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DynamicMenuItem = ({ menu, isOpen, level = 0, sidebarTheme }: DynamicNavItemProps) => {
  // If menu has children, render as submenu
  if (menu.children && menu.children.length > 0) {
    return (
      <DynamicSubMenu 
        menu={menu} 
        isOpen={isOpen} 
        level={level}
        sidebarTheme={sidebarTheme}
      />
    );
  }

  // If menu has no children, render as nav item
  return (
    <DynamicNavItem 
      menu={menu} 
      isOpen={isOpen} 
      level={level}
      sidebarTheme={sidebarTheme}
    />
  );
};

// Sidebar content component to be reused in both mobile and desktop
const SidebarContent = ({ 
  isOpen, 
  currentThemeColor, 
  textColor, 
  appName, 
  logoPortraitUrl,
  isDark, 
  sidebarMenus, 
  isLoading, 
  error 
}: {
  isOpen: boolean;
  currentThemeColor: string;
  textColor: string;
  appName: string;
  logoPortraitUrl?: string | null;
  isDark: boolean;
  sidebarMenus: SidebarMenu[];
  isLoading: boolean;
  error: any;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 0);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight);
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [isLoading, error, updateScrollState]);

  if (isLoading) {
    return (
      <>
        <div className={cn(
          "flex items-center justify-center h-16 border-b px-4 flex-shrink-0",
          "border-sidebar-border"
        )}>
          <div className={cn("w-full flex items-center justify-center", isOpen ? "gap-3" : "")}>
            {logoPortraitUrl ? (
              <img
                src={logoPortraitUrl}
                alt={`${appName} logo`}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <h1 className="text-xl font-bold" style={{ color: textColor }}>
              {isOpen ? appName : (appName.substring(0, Math.min(2, appName.length)).toUpperCase() || "ON")}
            </h1>
          </div>
        </div>
        <div className="py-4 px-2 space-y-1 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hidden">
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
          <div className={cn("w-full flex items-center justify-center", isOpen ? "gap-3" : "")}>
            {logoPortraitUrl ? (
              <img
                src={logoPortraitUrl}
                alt={`${appName} logo`}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <h1 className="text-xl font-bold" style={{ color: textColor }}>
              {isOpen ? appName : (appName.substring(0, Math.min(2, appName.length)).toUpperCase() || "ON")}
            </h1>
          </div>
        </div>
        <div className="py-4 px-2 space-y-1 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hidden">
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
        <div className={cn("w-full flex items-center justify-center", isOpen ? "gap-3" : "")}>
          {logoPortraitUrl ? (
            <div className="flex-shrink-0 rounded-lg bg-white/15 p-1">
              <img
                src={logoPortraitUrl}
                alt={`${appName} logo`}
                className="h-7 w-7 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : null}
          <h1 className="text-xl font-bold" style={{ color: textColor }}>
            {isOpen ? appName : (appName.substring(0, Math.min(2, appName.length)).toUpperCase() || "ON")}
          </h1>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex flex-col">
        {canScrollUp && (
          <div
            className="absolute top-0 left-0 right-0 h-12 z-10 pointer-events-none transition-opacity duration-200"
            style={{
              background: `linear-gradient(to bottom, ${currentThemeColor}, transparent)`,
            }}
            aria-hidden
          />
        )}
        <div
          ref={scrollRef}
          className={cn(
            "py-4 px-2 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hidden",
            isOpen ? "flex flex-col gap-1" : "grid grid-cols-1 grid-auto-rows-[2.5rem] gap-1"
          )}
          onScroll={updateScrollState}
        >
          {sidebarMenus.map((menu) => (
            <DynamicMenuItem 
              key={menu.id} 
              menu={menu} 
              isOpen={isOpen} 
              level={0}
              sidebarTheme={isOpen ? undefined : { currentThemeColor, textColor, isDark }}
            />
          ))}
        </div>
        {canScrollDown && (
          <div
            className="absolute bottom-0 left-0 right-0 h-12 z-10 pointer-events-none transition-opacity duration-200"
            style={{
              background: `linear-gradient(to top, ${currentThemeColor}, transparent)`,
            }}
            aria-hidden
          />
        )}
      </div>
    </>
  );
};

const DynamicSidebar = ({ isOpen, onClose }: DynamicSidebarProps) => {
  const { isDark, theme } = useTheme();
  const { appName, logoPortraitUrl } = useAppBranding();
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
              logoPortraitUrl={logoPortraitUrl}
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
        logoPortraitUrl={logoPortraitUrl}
        isDark={isDark}
        sidebarMenus={sidebarMenus}
        isLoading={isLoading}
        error={error}
      />
    </aside>
  );
};

export default DynamicSidebar;
