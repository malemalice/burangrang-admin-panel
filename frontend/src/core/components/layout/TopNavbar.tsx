import React, { useState } from 'react';
import { Button } from "@/core/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import {
  Bell,
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { cn } from '@/core/lib/utils';
import { useAuth } from '@/core/lib/auth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/core/lib/theme';
import { NotificationDropdown } from '@/modules/notifications';
import routes from '@/core/routes';

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

    if (paths.length === 0) return [{ name: 'Dashboard', path: '/', clickable: true }];

    // Custom name mapping untuk breadcrumb yang lebih user-friendly
    const nameMapping: Record<string, string> = {
      'master': 'Master Data',
      'ppe': 'PPE Management',
      'safety-equipment-types': 'Safety Equipment Types',
      'safety-equipments': 'Safety Equipments',
      'stocks': 'Stocks',
      'withdrawals': 'Withdrawals',
    };

    // Helper function untuk check jika route exists
    const routeExists = (path: string): boolean => {
      return routes.some(route => route.path === path);
    };

    return [
      { name: 'Dashboard', path: '/', clickable: true },
      ...paths.map((path, index) => {
        const url = `/${paths.slice(0, index + 1).join('/')}`;
        const formattedName = nameMapping[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
        const clickable = routeExists(url);

        return { name: formattedName, path: url, clickable };
      })
    ];
  };

  const items = breadcrumbItems();

  // Get user's display name
  const getDisplayName = () => {
    if (!user) return 'User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';

    const firstNameInitial = user.firstName ? user.firstName.charAt(0) : '';
    const lastNameInitial = user.lastName ? user.lastName.charAt(0) : '';

    if (firstNameInitial && lastNameInitial) {
      return `${firstNameInitial}${lastNameInitial}`;
    }

    return user.email ? user.email.charAt(0).toUpperCase() : 'U';
  };

  // Get user role name to display
  const getUserRole = () => {
    if (!user) return 'User';
    // Handle both string and object role formats
    if (typeof user.role === 'string') {
      return user.role;
    } else if (user.role && typeof user.role === 'object') {
      return (user.role as { name: string }).name;
    }
    return 'User';
  };

  return (
    <div className={cn(
      "h-16 border-b flex items-center justify-between px-4 bg-background border-border relative z-0",
      "transition-all duration-300 ease-in-out"
    )}>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mr-4 text-foreground z-50 relative"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </Button>

        {/* Custom Breadcrumb Implementation */}
        <div className="hidden md:block mr-4">
          <nav aria-label="breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;

                // Only add separator if not the last item
                const separator = !isLast ? (
                  <span
                    key={`sep-${item.path}`}
                    className="mx-1 text-slate-400"
                    aria-hidden="true"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                ) : null;

                return (
                  <li
                    key={item.path}
                    className="inline-flex items-center gap-1.5"
                  >
                    {isLast || !item.clickable ? (
                      <span
                        className={isLast ? "text-foreground font-medium" : "text-muted-foreground"}
                        aria-current={isLast ? "page" : undefined}
                      >
                        {item.name}
                      </span>
                    ) : (
                      <Link
                        to={item.path}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    )}
                    {separator}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMode}
          className="text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative flex items-center gap-2 hover:bg-accent hover:text-accent-foreground"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-admin-primary text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getUserRole()}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopNavbar;
