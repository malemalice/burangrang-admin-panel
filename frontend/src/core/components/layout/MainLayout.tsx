import React, { useState, useEffect, useMemo } from 'react';
import DynamicSidebar from './DynamicSidebar';
import TopNavbar from './TopNavbar';
import { Toaster } from "sonner";
import { cn } from '@/core/lib/utils';
import { useTheme } from '@/core/lib/theme';
import { useAppName, useDocumentTitle } from '@/modules/settings/hooks/useSettings';
import { MenuProvider, useMenuContext } from '@/core/contexts/MenuContext';
import { useIsMobile } from '@/core/hooks/useIsMobile';
import { useAuth } from '@/core/lib/auth';
import { useLocation } from 'react-router-dom';
import { isUUID } from '@/core/hooks/useEntityDisplayName';
import { Menu } from '@/modules/menus/types/menu.types';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Flattens the full menu tree into a path→name lookup map.
 * Skips entries with no real path (path === '#' or null).
 */
const buildPathNameMap = (menus: Menu[]): Record<string, string> => {
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

/**
 * Sets the browser tab title from the current route using menu names from the backend.
 * Must be rendered inside <MenuProvider> and <BrowserRouter>.
 * e.g. /master/ppe → "Master Data > PPE Management - HSE System"
 */
const RouteAwareTitleManager = () => {
  const location = useLocation();
  const { menus } = useMenuContext();
  const pathNameMap = useMemo(() => buildPathNameMap(menus), [menus]);

  const segments = location.pathname.split('/').filter(Boolean);
  const routeTitle = segments
    .map((segment, idx) => {
      if (isUUID(segment)) return null;
      const cumulativePath = '/' + segments.slice(0, idx + 1).join('/');
      return (
        pathNameMap[cumulativePath] ??
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      );
    })
    .filter(Boolean)
    .join(' > ');

  useDocumentTitle(routeTitle || undefined);
  return null;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isDark } = useTheme();
  const { appName } = useAppName();
  const isMobile = useIsMobile();
  const { isEmbedContext } = useAuth();

  // Close sidebar on mobile by default, keep open on desktop
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Embed mode: main content only, no sidebar, no top nav, no footer
  if (isEmbedContext) {
    return (
      <MenuProvider>
        <RouteAwareTitleManager />
        <div className={cn(
          "min-h-screen flex",
          isDark
            ? "bg-gray-900 text-gray-100"
            : "bg-admin-background text-admin-foreground"
        )}>
          <main className="flex-1 min-w-0 p-4 md:p-6 overflow-x-hidden overflow-y-auto">
            <div className="animate-fade-in min-w-0 overflow-hidden">
              {children}
            </div>
          </main>
          <Toaster position="bottom-right" richColors />
        </div>
      </MenuProvider>
    );
  }

  return (
    <MenuProvider>
      <RouteAwareTitleManager />
      <div className={cn(
        "min-h-screen flex",
        isDark 
          ? "bg-gray-900 text-gray-100" 
          : "bg-admin-background text-admin-foreground"
      )}>
        <DynamicSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          "ml-0", // No margin on mobile
          sidebarOpen ? "md:ml-64" : "md:ml-20" // Margin only on desktop
        )}>
          <TopNavbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
          <main className="flex-1 min-w-0 p-4 md:p-6 overflow-x-hidden overflow-y-auto">
            <div className="animate-fade-in min-w-0 overflow-hidden">
              {children}
            </div>
          </main>
          <footer className={cn(
            "py-4 px-6 text-center text-sm border-t",
            isDark 
              ? "text-gray-400 border-gray-700" 
              : "text-slate-500 border-slate-200"
          )}>
            <p>© {new Date().getFullYear()} {appName} System. All rights reserved.</p>
          </footer>
        </div>
        
        <Toaster position="bottom-right" richColors />
      </div>
    </MenuProvider>
  );
};

export default MainLayout;
