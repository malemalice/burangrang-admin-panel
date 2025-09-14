import React from 'react';
import { cn } from '@/core/lib/utils';

// Import only essential icons used in the sidebar and menu forms
import {
  LayoutDashboard, Menu, Home, Settings, User, Users, UserPlus, UserCog,
  Shield, ShieldCheck, Lock, Key, FileText, File, Files, Folder,
  Database, Table, BarChart3, PieChart, TrendingUp, Activity,
  Calendar, Mail, MessageSquare, Bell, Plus, Edit, Trash2,
  Save, X, AlertTriangle, Info, Star, Heart, Bookmark,
  Eye, EyeOff, CheckCircle, XCircle, HelpCircle, Play, Pause,
  Camera, Image, Video, Music, Download, Upload, Share, ExternalLink,
  Link, Globe, MapPin, Smartphone, Monitor, Laptop, Server, Cloud,
  Code, Terminal, GitBranch, Bug, Lightbulb, Target, Flag, Award,
  Trophy, Gift, Coffee, Zap, Battery, Wifi, WifiOff, Mouse, Keyboard,
  Printer, Building, Building2, Briefcase, CreditCard, DollarSign,
  Package, Truck, ShoppingCart, ChevronDown, ChevronUp, ChevronLeft,
  ChevronRight, UsersRound
} from 'lucide-react';

// Icon mapping for efficient lookup
const iconMap: Record<string, any> = {
  LayoutDashboard, Menu, Home, Settings, User, Users, UserPlus, UserCog,
  Shield, ShieldCheck, Lock, Key, FileText, File, Files, Folder,
  Database, Table, BarChart3, PieChart, TrendingUp, Activity,
  Calendar, Mail, MessageSquare, Bell, Plus, Edit, Trash2,
  Save, X, AlertTriangle, Info, Star, Heart, Bookmark,
  Eye, EyeOff, CheckCircle, XCircle, HelpCircle, Play, Pause,
  Camera, Image, Video, Music, Download, Upload, Share, ExternalLink,
  Link, Globe, MapPin, Smartphone, Monitor, Laptop, Server, Cloud,
  Code, Terminal, GitBranch, Bug, Lightbulb, Target, Flag, Award,
  Trophy, Gift, Coffee, Zap, Battery, Wifi, WifiOff, Mouse, Keyboard,
  Printer, Building, Building2, Briefcase, CreditCard, DollarSign,
  Package, Truck, ShoppingCart, ChevronDown, ChevronUp, ChevronLeft,
  ChevronRight, UsersRound
};

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, className, size = 16 }) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    // Fallback: show a simple div with the first letter
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded bg-gray-200 text-gray-600 font-medium text-xs",
          className
        )}
        style={{ width: size, height: size }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return <IconComponent className={className} size={size} />;
};

// Export the icon mapping for external use
export { iconMap };
