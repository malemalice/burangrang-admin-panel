import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Menu as MenuIcon,
  Building2,
  Settings,
  ChevronDown,
  ChevronRight,
  Building,
  UsersRound
} from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface SidebarProps {
  isOpen: boolean;
}

interface NavItemProps {
  to: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  isOpen?: boolean;
}

interface SubMenuProps {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  children: React.ReactNode;
}

// Common styles for both NavItem and SubMenu
const getNavStyles = (isDark: boolean, isActive = false) => {
  if (isActive) {
    return isDark
      ? "bg-gray-700 text-white font-medium"
      : "bg-white/10 text-white font-medium";
  }
  
  return isDark
    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
    : "text-white/80 hover:bg-white/10 hover:text-white";
};

const NavItem = ({ to, icon: Icon, children, isOpen = true }: NavItemProps) => {
  const { isDark } = useTheme();

  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center text-sm py-2 px-4 rounded-md transition-all",
        getNavStyles(isDark, isActive),
        !isOpen && "justify-center px-2"
      )}
    >
      {Icon && <Icon size={20} className={cn(!isOpen && "mx-auto")} />}
      {isOpen && <span className={cn(Icon && "ml-3")}>{children}</span>}
    </NavLink>
  );
};

const SubMenu = ({ title, icon: Icon, isOpen, children }: SubMenuProps) => {
  const [expanded, setExpanded] = useState(false);
  const { isDark } = useTheme();

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center w-full text-sm py-3 px-4 rounded-md transition-all",
          getNavStyles(isDark),
          !isOpen && "justify-center px-2"
        )}
      >
        <Icon size={20} className={cn(!isOpen && "mx-auto")} />
        {isOpen && (
          <>
            <span className="ml-3 flex-1 text-left">{title}</span>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </>
        )}
      </button>
      {isOpen && expanded && (
        <div className="pl-10 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen }: SidebarProps) => {
  const { isDark } = useTheme();

  return (
    <aside
      className={cn(
        "fixed h-full border-r shadow-sm z-30 transition-all duration-300 ease-in-out",
        isDark
          ? "bg-gray-900 border-gray-800"
          : "bg-admin-primary border-admin-primary/30",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className={cn(
        "flex items-center justify-center h-16 border-b px-4",
        isDark ? "border-gray-800" : "border-white/10"
      )}>
        <h1 className="text-xl font-bold text-white">
          {isOpen ? "Office Nexus" : "ON"}
        </h1>
      </div>

      <div className="py-4 px-2 space-y-1">
        <NavItem to="/" icon={LayoutDashboard} isOpen={isOpen}>Dashboard</NavItem>

        <SubMenu title="Master Data" icon={Building2} isOpen={isOpen}>
          <NavItem to="/master/offices" icon={Building}>Offices</NavItem>
          <NavItem to="/master/departments" icon={UsersRound}>Departments</NavItem>
          <NavItem to="/users" icon={Users} isOpen={isOpen}>Users</NavItem>
          <NavItem to="/roles" icon={ShieldCheck} isOpen={isOpen}>Roles</NavItem>
          <NavItem to="/menus" icon={MenuIcon} isOpen={isOpen}>Menus</NavItem>
        </SubMenu>

        <NavItem to="/settings" icon={Settings} isOpen={isOpen}>Settings</NavItem>
      </div>
    </aside>
  );
};

export default Sidebar;
