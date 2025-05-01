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
  ChevronRight
} from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface SidebarProps {
  isOpen: boolean;
}

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isOpen: boolean;
}

interface SubMenuProps {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, isOpen }: NavItemProps) => {
  const { isDark } = useTheme();
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center text-sm py-3 px-4 rounded-md transition-all",
        isActive 
          ? "bg-admin-primary text-white font-medium shadow-md" 
          : isDark 
            ? "text-gray-300 hover:bg-gray-700" 
            : "text-slate-700 hover:bg-slate-100",
        !isOpen && "justify-center px-2"
      )}
    >
      <Icon size={20} className={cn(!isOpen && "mx-auto")} />
      {isOpen && <span className="ml-3">{label}</span>}
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
          isDark 
            ? "text-gray-300 hover:bg-gray-700" 
            : "text-slate-700 hover:bg-slate-100",
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
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-slate-200",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className={cn(
        "flex items-center justify-center h-16 border-b px-4",
        isDark ? "border-gray-700" : "border-slate-200"
      )}>
        {isOpen ? (
          <h1 className={cn(
            "text-xl font-bold",
            isDark ? "text-white" : "text-admin-primary"
          )}>
            Office Nexus
          </h1>
        ) : (
          <h1 className={cn(
            "text-xl font-bold",
            isDark ? "text-white" : "text-admin-primary"
          )}>
            ON
          </h1>
        )}
      </div>
      
      <div className="py-4 px-2 space-y-1">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" isOpen={isOpen} />
        <NavItem to="/users" icon={Users} label="Users" isOpen={isOpen} />
        <NavItem to="/roles" icon={ShieldCheck} label="Roles" isOpen={isOpen} />
        <NavItem to="/menus" icon={MenuIcon} label="Menus" isOpen={isOpen} />
        
        <SubMenu title="Master Data" icon={Building2} isOpen={isOpen}>
          <NavLink 
            to="/master/offices"
            className={({ isActive }) => cn(
              "flex items-center text-sm py-2 px-4 rounded-md transition-all",
              isActive 
                ? isDark 
                  ? "bg-admin-primary/20 text-blue-400 font-medium" 
                  : "bg-admin-primary/10 text-admin-primary font-medium" 
                : isDark
                  ? "text-gray-400 hover:bg-gray-700 hover:text-blue-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-admin-primary"
            )}
          >
            Offices
          </NavLink>
          <NavLink 
            to="/master/departments"
            className={({ isActive }) => cn(
              "flex items-center text-sm py-2 px-4 rounded-md transition-all",
              isActive 
                ? isDark 
                  ? "bg-admin-primary/20 text-blue-400 font-medium" 
                  : "bg-admin-primary/10 text-admin-primary font-medium" 
                : isDark
                  ? "text-gray-400 hover:bg-gray-700 hover:text-blue-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-admin-primary"
            )}
          >
            Departments
          </NavLink>
          <NavLink 
            to="/master/positions"
            className={({ isActive }) => cn(
              "flex items-center text-sm py-2 px-4 rounded-md transition-all",
              isActive 
                ? isDark 
                  ? "bg-admin-primary/20 text-blue-400 font-medium" 
                  : "bg-admin-primary/10 text-admin-primary font-medium" 
                : isDark
                  ? "text-gray-400 hover:bg-gray-700 hover:text-blue-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-admin-primary"
            )}
          >
            Positions
          </NavLink>
          <NavLink 
            to="/master/assets"
            className={({ isActive }) => cn(
              "flex items-center text-sm py-2 px-4 rounded-md transition-all",
              isActive 
                ? isDark 
                  ? "bg-admin-primary/20 text-blue-400 font-medium" 
                  : "bg-admin-primary/10 text-admin-primary font-medium" 
                : isDark
                  ? "text-gray-400 hover:bg-gray-700 hover:text-blue-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-admin-primary"
            )}
          >
            Assets
          </NavLink>
        </SubMenu>
        
        <NavItem to="/settings" icon={Settings} label="Settings" isOpen={isOpen} />
      </div>
    </aside>
  );
};

export default Sidebar;
