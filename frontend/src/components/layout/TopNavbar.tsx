import { useState } from 'react';
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

interface TopNavbarProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

const TopNavbar = ({ toggleSidebar, sidebarOpen }: TopNavbarProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const { logout, user } = useAuth();
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Here we would add actual dark mode toggle implementation
  };
  
  return (
    <div className="h-16 border-b border-admin-border flex items-center justify-between px-4 bg-white">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mr-4"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </Button>
        
        <div className={cn(
          "relative hidden lg:flex items-center bg-gray-100 rounded-md",
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-96"
        )}>
          <Search className="absolute left-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="py-2 pl-10 pr-4 bg-transparent w-full rounded-md focus:outline-none"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-gray-600">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h4 className="font-medium text-sm">Notifications</h4>
              <Button variant="ghost" size="sm" className="text-xs">Mark all as read</Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-2 hover:bg-gray-50 border-b last:border-0">
                  <p className="text-sm">
                    <span className="font-medium">John Doe</span> added a new document
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">2 hours ago</p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex items-center gap-2" aria-label="User menu">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'Administrator'}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopNavbar;
