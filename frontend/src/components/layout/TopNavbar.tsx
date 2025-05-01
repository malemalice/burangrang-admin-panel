import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, 
  Menu, 
  Search,
  User,
  Settings,
  LogOut,
  Sun,
  Moon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/lib/theme';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";

interface TopNavbarProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

const TopNavbar = ({ toggleSidebar, sidebarOpen }: TopNavbarProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';
  
  // Format breadcrumb items from current path
  const breadcrumbItems = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    
    if (paths.length === 0) return [{ name: 'Dashboard', path: '/' }];
    
    return [
      { name: 'Dashboard', path: '/' },
      ...paths.map((path, index) => {
        const url = `/${paths.slice(0, index + 1).join('/')}`;
        const formattedName = path.charAt(0).toUpperCase() + path.slice(1);
        return { name: formattedName, path: url };
      })
    ];
  };
  
  const items = breadcrumbItems();
  
  return (
    <div className="h-16 border-b flex items-center justify-between px-4 bg-white dark:bg-gray-800 dark:border-gray-700 border-slate-200">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mr-4 text-slate-700 dark:text-gray-300"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </Button>
        
        {/* Breadcrumb for medium and larger screens */}
        <div className="hidden md:block mr-4">
          <Breadcrumb>
            <BreadcrumbList>
              {items.map((item, index) => (
                <React.Fragment key={item.path}>
                  {index < items.length - 1 ? (
                    <BreadcrumbItem>
                      <BreadcrumbLink 
                        asChild
                        className="text-slate-600 dark:text-gray-300 hover:text-admin-primary hover:dark:text-blue-400"
                      >
                        <Link to={item.path}>{item.name}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-slate-900 dark:text-white font-medium">
                        {item.name}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                  
                  {index < items.length - 1 && (
                    <BreadcrumbSeparator className="text-slate-400" />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        <div className={cn(
          "relative hidden lg:flex items-center bg-slate-100 dark:bg-gray-700 rounded-md",
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-96"
        )}>
          <Search className="absolute left-3 text-slate-400 dark:text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="py-2 pl-10 pr-4 bg-transparent w-full rounded-md focus:outline-none text-slate-900 dark:text-gray-200 placeholder-slate-500 dark:placeholder-gray-400"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMode} 
          className="text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 border-slate-200">
              <h4 className="font-medium text-sm dark:text-white">Notifications</h4>
              <Button variant="ghost" size="sm" className="text-xs dark:text-gray-300 dark:hover:bg-gray-700 hover:bg-slate-100">
                Mark all as read
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 border-slate-200 last:border-0">
                  <p className="text-sm dark:text-white">
                    <span className="font-medium">John Doe</span> added a new document
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">2 hours ago</p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t dark:border-gray-700 border-slate-200">
              <Button variant="ghost" size="sm" className="w-full text-xs dark:text-gray-300 dark:hover:bg-gray-700 hover:bg-slate-100">
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-gray-700" 
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-admin-primary text-white">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  {user?.role || 'Administrator'}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
            <DropdownMenuItem className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:bg-gray-700 hover:bg-slate-100 focus:bg-slate-100">
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:bg-gray-700 hover:bg-slate-100 focus:bg-slate-100" onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="dark:border-gray-700 border-slate-200" />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-500 focus:text-red-500 dark:focus:text-red-400 dark:hover:bg-gray-700 hover:bg-slate-100">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopNavbar;
