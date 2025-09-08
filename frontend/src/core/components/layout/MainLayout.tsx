import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { Toaster } from "sonner";
import { cn } from '@/core/lib/utils';
import { useTheme } from '@/core/lib/theme';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isDark } = useTheme();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={cn(
      "min-h-screen flex",
      isDark 
        ? "bg-gray-900 text-gray-100" 
        : "bg-admin-background text-admin-foreground"
    )}>
      <Sidebar isOpen={sidebarOpen} />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:ml-64" : "md:ml-20"
      )}>
        <TopNavbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="flex-1 p-4 md:p-6 overflow-x-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
        <footer className={cn(
          "py-4 px-6 text-center text-sm border-t",
          isDark 
            ? "text-gray-400 border-gray-700" 
            : "text-slate-500 border-slate-200"
        )}>
          <p>© {new Date().getFullYear()} Office Nexus System. All rights reserved.</p>
        </footer>
      </div>
      
      <Toaster position="bottom-right" richColors />
    </div>
  );
};

export default MainLayout;
