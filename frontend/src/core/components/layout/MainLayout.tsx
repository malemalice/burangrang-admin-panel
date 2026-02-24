import React, { useState, useEffect } from 'react';
import DynamicSidebar from './DynamicSidebar';
import TopNavbar from './TopNavbar';
import { Toaster } from "sonner";
import { cn } from '@/core/lib/utils';
import { useTheme } from '@/core/lib/theme';
import { useAppName } from '@/modules/settings/hooks/useSettings';
import { MenuProvider } from '@/core/contexts/MenuContext';
import { useIsMobile } from '@/core/hooks/useIsMobile';
import { useAuth } from '@/core/lib/auth';

interface MainLayoutProps {
  children: React.ReactNode;
}

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
