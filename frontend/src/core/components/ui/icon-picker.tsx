import { useState, useMemo } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
// Using CSS overflow for scrolling instead of ScrollArea component
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover";

// Common admin panel icons from Lucide React
const ADMIN_ICONS = [
  // Navigation & Layout
  { name: "LayoutDashboard", icon: "LayoutDashboard", category: "Navigation" },
  { name: "Menu", icon: "Menu", category: "Navigation" },
  { name: "Sidebar", icon: "Sidebar", category: "Navigation" },
  { name: "Home", icon: "Home", category: "Navigation" },
  { name: "Settings", icon: "Settings", category: "Navigation" },
  { name: "User", icon: "User", category: "User Management" },
  { name: "Users", icon: "Users", category: "User Management" },
  { name: "UserPlus", icon: "UserPlus", category: "User Management" },
  { name: "UserCog", icon: "UserCog", category: "User Management" },
  { name: "Shield", icon: "Shield", category: "Security" },
  { name: "ShieldCheck", icon: "ShieldCheck", category: "Security" },
  { name: "Lock", icon: "Lock", category: "Security" },
  { name: "Unlock", icon: "Unlock", category: "Security" },
  { name: "Key", icon: "Key", category: "Security" },
  { name: "FileText", icon: "FileText", category: "Content" },
  { name: "File", icon: "File", category: "Content" },
  { name: "Files", icon: "Files", category: "Content" },
  { name: "Folder", icon: "Folder", category: "Content" },
  { name: "FolderOpen", icon: "FolderOpen", category: "Content" },
  { name: "Database", icon: "Database", category: "Data" },
  { name: "Table", icon: "Table", category: "Data" },
  { name: "BarChart3", icon: "BarChart3", category: "Analytics" },
  { name: "PieChart", icon: "PieChart", category: "Analytics" },
  { name: "TrendingUp", icon: "TrendingUp", category: "Analytics" },
  { name: "Activity", icon: "Activity", category: "Analytics" },
  { name: "Calendar", icon: "Calendar", category: "Calendar" },
  { name: "Clock", icon: "Clock", category: "Time" },
  { name: "Mail", icon: "Mail", category: "Communication" },
  { name: "MessageSquare", icon: "MessageSquare", category: "Communication" },
  { name: "Bell", icon: "Bell", category: "Communication" },
  { name: "Phone", icon: "Phone", category: "Communication" },
  { name: "Search", icon: "Search", category: "Actions" },
  { name: "Plus", icon: "Plus", category: "Actions" },
  { name: "Minus", icon: "Minus", category: "Actions" },
  { name: "Edit", icon: "Edit", category: "Actions" },
  { name: "Trash2", icon: "Trash2", category: "Actions" },
  { name: "Save", icon: "Save", category: "Actions" },
  { name: "Download", icon: "Download", category: "Actions" },
  { name: "Upload", icon: "Upload", category: "Actions" },
  { name: "Eye", icon: "Eye", category: "Actions" },
  { name: "EyeOff", icon: "EyeOff", category: "Actions" },
  { name: "Check", icon: "Check", category: "Status" },
  { name: "X", icon: "X", category: "Status" },
  { name: "CheckCircle", icon: "CheckCircle", category: "Status" },
  { name: "XCircle", icon: "XCircle", category: "Status" },
  { name: "AlertTriangle", icon: "AlertTriangle", category: "Status" },
  { name: "Info", icon: "Info", category: "Status" },
  { name: "HelpCircle", icon: "HelpCircle", category: "Status" },
  { name: "Star", icon: "Star", category: "Rating" },
  { name: "Heart", icon: "Heart", category: "Rating" },
  { name: "Bookmark", icon: "Bookmark", category: "Actions" },
  { name: "Share", icon: "Share", category: "Actions" },
  { name: "Link", icon: "Link", category: "Actions" },
  { name: "ExternalLink", icon: "ExternalLink", category: "Actions" },
  { name: "Globe", icon: "Globe", category: "Global" },
  { name: "MapPin", icon: "MapPin", category: "Location" },
  { name: "Camera", icon: "Camera", category: "Media" },
  { name: "Image", icon: "Image", category: "Media" },
  { name: "Video", icon: "Video", category: "Media" },
  { name: "Music", icon: "Music", category: "Media" },
  { name: "Play", icon: "Play", category: "Media" },
  { name: "Pause", icon: "Pause", category: "Media" },
  { name: "ShoppingCart", icon: "ShoppingCart", category: "Commerce" },
  { name: "CreditCard", icon: "CreditCard", category: "Commerce" },
  { name: "DollarSign", icon: "DollarSign", category: "Commerce" },
  { name: "Package", icon: "Package", category: "Commerce" },
  { name: "Truck", icon: "Truck", category: "Commerce" },
  { name: "Building", icon: "Building", category: "Business" },
  { name: "Building2", icon: "Building2", category: "Business" },
  { name: "Briefcase", icon: "Briefcase", category: "Business" },
  { name: "Coffee", icon: "Coffee", category: "Lifestyle" },
  { name: "Zap", icon: "Zap", category: "Energy" },
  { name: "Battery", icon: "Battery", category: "Energy" },
  { name: "Wifi", icon: "Wifi", category: "Connectivity" },
  { name: "WifiOff", icon: "WifiOff", category: "Connectivity" },
  { name: "Monitor", icon: "Monitor", category: "Devices" },
  { name: "Mouse", icon: "Mouse", category: "Devices" },
  { name: "Keyboard", icon: "Keyboard", category: "Devices" },
  { name: "Printer", icon: "Printer", category: "Devices" },
  { name: "Smartphone", icon: "Smartphone", category: "Devices" },
  { name: "Tablet", icon: "Tablet", category: "Devices" },
  { name: "Laptop", icon: "Laptop", category: "Devices" },
  { name: "Server", icon: "Server", category: "Technology" },
  { name: "Cloud", icon: "Cloud", category: "Technology" },
  { name: "Code", icon: "Code", category: "Development" },
  { name: "Terminal", icon: "Terminal", category: "Development" },
  { name: "GitBranch", icon: "GitBranch", category: "Development" },
  { name: "Bug", icon: "Bug", category: "Development" },
  { name: "Lightbulb", icon: "Lightbulb", category: "Ideas" },
  { name: "Target", icon: "Target", category: "Goals" },
  { name: "Flag", icon: "Flag", category: "Goals" },
  { name: "Award", icon: "Award", category: "Achievement" },
  { name: "Trophy", icon: "Trophy", category: "Achievement" },
  { name: "Gift", icon: "Gift", category: "Rewards" },
] as const;

// Import commonly used icons for efficiency
import {
  LayoutDashboard, Menu, Home, Settings, User, Users, UserPlus, UserCog,
  Shield, ShieldCheck, Lock, Key, FileText, File, Files, Folder,
  Database, Table, BarChart3, PieChart, TrendingUp, Activity,
  Calendar, Mail, MessageSquare, Bell, Search, Plus, Edit, Trash2,
  Save, Check, X, AlertTriangle, Info, Star, Heart, Bookmark,
  Eye, EyeOff, CheckCircle, XCircle, HelpCircle, Play, Pause,
  Camera, Image, Video, Music, Download, Upload, Share, ExternalLink,
  Link, Globe, MapPin, Smartphone, Monitor, Laptop, Server, Cloud,
  Code, Terminal, GitBranch, Bug, Lightbulb, Target, Flag, Award,
  Trophy, Gift, Coffee, Zap, Battery, Wifi, WifiOff, Mouse, Keyboard,
  Printer, Building, Building2, Briefcase, CreditCard, DollarSign,
  Package, Truck, ShoppingCart
} from 'lucide-react';

// Icon mapping for efficient lookup
const iconMap: Record<string, any> = {
  LayoutDashboard, Menu, Home, Settings, User, Users, UserPlus, UserCog,
  Shield, ShieldCheck, Lock, Key, FileText, File, Files, Folder,
  Database, Table, BarChart3, PieChart, TrendingUp, Activity,
  Calendar, Mail, MessageSquare, Bell, Search, Plus, Edit, Trash2,
  Save, Check, X, AlertTriangle, Info, Star, Heart, Bookmark,
  Eye, EyeOff, CheckCircle, XCircle, HelpCircle, Play, Pause,
  Camera, Image, Video, Music, Download, Upload, Share, ExternalLink,
  Link, Globe, MapPin, Smartphone, Monitor, Laptop, Server, Cloud,
  Code, Terminal, GitBranch, Bug, Lightbulb, Target, Flag, Award,
  Trophy, Gift, Coffee, Zap, Battery, Wifi, WifiOff, Mouse, Keyboard,
  Printer, Building, Building2, Briefcase, CreditCard, DollarSign,
  Package, Truck, ShoppingCart
};

// Simple and efficient icon renderer using icon name
const IconRenderer = ({ iconName, className }: { iconName: string; className?: string }) => {
  // Use a simple div with icon name for preview - much more efficient
  if (!iconName) {
    return <div className={cn("w-4 h-4 bg-gray-200 rounded flex items-center justify-center", className)}>
      <span className="text-xs text-gray-500">?</span>
    </div>;
  }

  // For preview, just show a simple representation
  return <div className={cn("w-4 h-4 bg-blue-100 rounded flex items-center justify-center", className)}>
    <span className="text-xs text-blue-600 font-medium">
      {iconName.charAt(0).toUpperCase()}
    </span>
  </div>;
};

// Export a function to get the actual icon component by name
export const getIconByName = (iconName: string) => {
  return iconMap[iconName] || null;
};

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function IconPicker({
  value,
  onChange,
  placeholder = "Select an icon...",
  className,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(ADMIN_ICONS.map(icon => icon.category))];
    return cats.sort();
  }, []);

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery) return ADMIN_ICONS;

    return ADMIN_ICONS.filter(icon =>
      icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      icon.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Group filtered icons by category
  const groupedIcons = useMemo(() => {
    const groups: Record<string, typeof ADMIN_ICONS> = {};

    filteredIcons.forEach(icon => {
      if (!groups[icon.category]) {
        groups[icon.category] = [];
      }
      groups[icon.category].push(icon);
    });

    return groups;
  }, [filteredIcons]);

  const selectedIcon = ADMIN_ICONS.find(icon => icon.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            {selectedIcon ? (
              <>
                <IconRenderer iconName={selectedIcon.icon} className="w-4 h-4" />
                <span>{selectedIcon.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          <div className="p-2">
            {Object.entries(groupedIcons).map(([category, icons]) => (
              <div key={category} className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                  {category}
                </h4>
                <div className="grid grid-cols-6 gap-1">
                  {icons.map((icon) => (
                    <Button
                      key={icon.name}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-10 w-10 p-0 hover:bg-accent relative",
                        value === icon.name && "bg-accent"
                      )}
                      onClick={() => {
                        onChange(icon.name);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                      title={icon.name}
                    >
                      <IconRenderer iconName={icon.icon} className="w-4 h-4" />
                      {value === icon.name && (
                        <Check className="absolute inset-0 w-3 h-3 m-auto text-primary" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {filteredIcons.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No icons found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Export the icon list for external use
export { ADMIN_ICONS };
