/**
 * Office Nexus Design System - Color System
 * 
 * This file defines the color tokens for the entire application.
 * Always use these tokens instead of hard-coded color values.
 */

/**
 * Base Color Palette
 * These are the raw color values that serve as the foundation
 */
export const baseColors = {
  // Primary Brand Colors
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Primary brand color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  
  // Secondary Brand Colors
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#8b5cf6', // Secondary brand color
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  
  // Accent
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Accent color
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },
  
  // Neutrals
  slate: {
    50: '#f8fafc',  // Background
    100: '#f1f5f9',  // Muted
    200: '#e2e8f0',  // Border
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',  // Foreground
    900: '#0f172a',
    950: '#020617',
  },
  
  // Semantic colors
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },
  
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  
  white: '#ffffff',
  black: '#000000',
};

/**
 * Semantic Color Tokens
 * These map to specific UI elements and components
 */
export const semanticColors = {
  // App-level colors
  app: {
    background: baseColors.slate[50],
    foreground: baseColors.slate[800],
    primary: baseColors.indigo[500],
    secondary: baseColors.purple[700],
    accent: baseColors.orange[500],
    muted: baseColors.slate[100],
    border: baseColors.slate[200],
  },
  
  // Text colors
  text: {
    primary: baseColors.slate[800],
    secondary: baseColors.slate[600],
    muted: baseColors.slate[500],
    disabled: baseColors.slate[400],
    inverse: baseColors.white,
    link: baseColors.indigo[600],
    linkHover: baseColors.indigo[700],
  },
  
  // Button colors
  button: {
    primary: {
      background: baseColors.indigo[500],
      hoverBackground: baseColors.indigo[600],
      activeBackground: baseColors.indigo[700],
      foreground: baseColors.white,
    },
    secondary: {
      background: baseColors.slate[200],
      hoverBackground: baseColors.slate[300],
      activeBackground: baseColors.slate[400],
      foreground: baseColors.slate[800],
    },
    danger: {
      background: baseColors.red[500],
      hoverBackground: baseColors.red[600],
      activeBackground: baseColors.red[700],
      foreground: baseColors.white,
    },
    ghost: {
      background: 'transparent',
      hoverBackground: baseColors.slate[100],
      activeBackground: baseColors.slate[200],
      foreground: baseColors.slate[700],
    },
  },
  
  // Status colors
  status: {
    success: {
      light: baseColors.green[100],
      base: baseColors.green[500],
      dark: baseColors.green[700],
      foreground: baseColors.green[800],
    },
    warning: {
      light: baseColors.yellow[100],
      base: baseColors.yellow[500],
      dark: baseColors.yellow[700],
      foreground: baseColors.yellow[800],
    },
    error: {
      light: baseColors.red[100],
      base: baseColors.red[500],
      dark: baseColors.red[700],
      foreground: baseColors.red[800],
    },
    info: {
      light: baseColors.blue[100],
      base: baseColors.blue[500],
      dark: baseColors.blue[700],
      foreground: baseColors.blue[800],
    },
    neutral: {
      light: baseColors.gray[100],
      base: baseColors.gray[500],
      dark: baseColors.gray[700],
      foreground: baseColors.gray[800],
    },
  },
  
  // UI component colors
  ui: {
    card: {
      background: baseColors.white,
      border: baseColors.slate[200],
      header: baseColors.slate[50],
    },
    input: {
      background: baseColors.white,
      border: baseColors.slate[300],
      focusBorder: baseColors.indigo[500],
      placeholderText: baseColors.slate[400],
    },
    navbar: {
      background: baseColors.white,
      border: baseColors.slate[200],
    },
    sidebar: {
      background: baseColors.white,
      activeItem: baseColors.indigo[500],
      activeItemText: baseColors.white,
      itemText: baseColors.slate[700],
      itemHover: baseColors.slate[100],
    },
    modal: {
      overlay: 'rgba(0, 0, 0, 0.5)',
      background: baseColors.white,
    },
    tooltip: {
      background: baseColors.slate[800],
      text: baseColors.white,
    },
  },
};

/**
 * Theme Configuration
 * Predefined theme color sets
 */
export const themeColors = {
  blue: {
    primary: baseColors.blue[600],
    secondary: baseColors.blue[800],
    accent: baseColors.blue[400],
  },
  green: {
    primary: baseColors.green[600],
    secondary: baseColors.green[800],
    accent: baseColors.green[400],
  },
  purple: {
    primary: baseColors.purple[600],
    secondary: baseColors.purple[800],
    accent: baseColors.purple[400],
  },
  red: {
    primary: baseColors.red[600],
    secondary: baseColors.red[800],
    accent: baseColors.red[400],
  },
  orange: {
    primary: baseColors.orange[600],
    secondary: baseColors.orange[800],
    accent: baseColors.orange[400],
  },
  indigo: {
    primary: baseColors.indigo[600],
    secondary: baseColors.indigo[800],
    accent: baseColors.indigo[400],
  },
};

/**
 * User Status Badge Colors
 */
export const userStatusColors = {
  active: {
    background: baseColors.green[100],
    text: baseColors.green[800],
    border: 'transparent',
  },
  inactive: {
    background: baseColors.gray[100],
    text: baseColors.gray[800], 
    border: 'transparent',
  },
  pending: {
    background: baseColors.yellow[100],
    text: baseColors.yellow[800],
    border: 'transparent',
  },
}; 