import React, { useState, useMemo } from 'react';
import { Button } from "@/core/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import {
  Menu,
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
import { useEntityDisplayName, isUUID } from '@/core/hooks/useEntityDisplayName';
import { useMenuContext } from '@/core/contexts/MenuContext';

interface TopNavbarProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

// Component to render breadcrumb item with entity display name
const BreadcrumbItem = ({ 
  item, 
  isLast, 
  paths 
}: { 
  item: { name: string; path: string; clickable: boolean; isUUID?: boolean; pathIndex?: number }; 
  isLast: boolean; 
  paths: string[];
}) => {
  const location = useLocation();
  const entityDisplayName = useEntityDisplayName(
    paths,
    item.pathIndex ?? -1,
    location.state
  );

  // Use entity display name if available and item is a UUID, otherwise use formatted name
  const displayName = item.isUUID && entityDisplayName 
    ? entityDisplayName 
    : item.name;

  return (
    <li className="inline-flex min-w-0 items-center gap-1.5">
      {isLast || !item.clickable ? (
        <span
          className={cn(
            isLast ? 'text-foreground font-medium' : 'text-muted-foreground',
            'inline-block max-w-[220px] truncate align-bottom',
          )}
          title={displayName}
          aria-current={isLast ? "page" : undefined}
        >
          {displayName}
        </span>
      ) : (
        <Link
          to={item.path}
          className="inline-block max-w-[220px] truncate text-muted-foreground transition-colors hover:text-primary"
          title={displayName}
        >
          {displayName}
        </Link>
      )}
    </li>
  );
};

const TopNavbar = ({ toggleSidebar, sidebarOpen }: TopNavbarProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';
  const { pathNameMap } = useMenuContext();

  // Format breadcrumb items from current path using dynamic menu names from the backend
  const items = useMemo(() => {
    const paths = location.pathname.split('/').filter(Boolean);

    if (paths.length === 0) return [{ name: 'Home', path: '/', clickable: true }];

    const routeExists = (path: string): boolean =>
      routes.some(route => route.path === path);

    return [
      { name: 'Home', path: '/', clickable: true },
      ...paths.map((path, index) => {
        const url = `/${paths.slice(0, index + 1).join('/')}`;
        const name =
          pathNameMap[url] ??
          path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
        const clickable = routeExists(url);
        return { name, path: url, clickable, isUUID: isUUID(path), pathIndex: index };
      }),
    ];
  }, [location.pathname, pathNameMap]);

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
      <div className="flex min-w-0 flex-1 items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mr-4 shrink-0 text-foreground z-50 relative"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </Button>

        {/* Custom Breadcrumb Implementation */}
        <div className="mr-4 hidden min-w-0 flex-1 md:block">
          <nav aria-label="breadcrumb" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-sm text-muted-foreground sm:gap-2.5">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const paths = location.pathname.split('/').filter(Boolean);

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
                  <React.Fragment key={item.path}>
                    <BreadcrumbItem 
                      item={item} 
                      isLast={isLast} 
                      paths={paths}
                    />
                    {separator}
                  </React.Fragment>
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
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
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
