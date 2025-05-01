
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { Toaster } from "sonner";
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-admin-background text-admin-foreground flex">
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
        <footer className="py-4 px-6 text-center text-sm text-gray-500 border-t">
          <p>© {new Date().getFullYear()} Office Nexus System. All rights reserved.</p>
        </footer>
      </div>
      
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default MainLayout;
