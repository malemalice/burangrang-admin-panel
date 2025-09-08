import { useState, useEffect } from 'react';
import { themeColors, semanticColors, baseColors } from './colors';

/**
 * Theme utility types
 */
export type ThemeColor = keyof typeof themeColors;
export type ThemeMode = 'light' | 'dark';

/**
 * Gets the color value based on the selected theme
 */
export const getThemeColor = (theme: ThemeColor, colorType: 'primary' | 'secondary' | 'accent' = 'primary'): string => {
  return themeColors[theme][colorType];
};

/**
 * Initializes CSS variables from color constants
 * This function should be called when the app starts
 */
export const initializeThemeVariables = (theme: ThemeColor = 'blue', mode: ThemeMode = 'light'): void => {
  const root = document.documentElement;
  const themeColorSet = themeColors[theme];
  
  // Set theme-specific colors
  root.style.setProperty('--primary-color', themeColorSet.primary);
  root.style.setProperty('--primary-color-light', themeColorSet.accent);
  root.style.setProperty('--primary-color-dark', themeColorSet.secondary);
  root.style.setProperty('--secondary-color', themeColorSet.secondary);
  root.style.setProperty('--accent-color', themeColorSet.accent);

  // Set light mode default app colors
  if (mode === 'light') {
    // Background colors
    root.style.setProperty('--background-color', semanticColors.app.background);
    root.style.setProperty('--foreground-color', semanticColors.app.foreground);
    root.style.setProperty('--muted-color', semanticColors.app.muted);
    root.style.setProperty('--border-color', semanticColors.app.border);
    
    // Component-specific colors
    root.style.setProperty('--card-background', baseColors.white);
    root.style.setProperty('--input-border', baseColors.slate[300]);
    root.style.setProperty('--tooltip-bg', baseColors.slate[800]);
  }
  
  // Status colors (same for both modes)
  root.style.setProperty('--success-color', semanticColors.status.success.base);
  root.style.setProperty('--warning-color', semanticColors.status.warning.base);
  root.style.setProperty('--error-color', semanticColors.status.error.base);
  root.style.setProperty('--info-color', semanticColors.status.info.base);
  
  // Set foreground RGB values for rgba usage
  const hexToRgb = (hex: string): {r: number, g: number, b: number} | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const foregroundRgb = hexToRgb(semanticColors.app.foreground);
  if (foregroundRgb) {
    root.style.setProperty('--foreground-color-rgb', `${foregroundRgb.r}, ${foregroundRgb.g}, ${foregroundRgb.b}`);
  }
};

/**
 * Interface for the useTheme hook return value
 */
interface UseThemeReturn {
  theme: ThemeColor;
  mode: ThemeMode;
  setTheme: (theme: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
}

/**
 * Hook for managing theme in the application
 */
export const useTheme = (): UseThemeReturn => {
  // Get initial theme from localStorage or use default 'blue'
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    const savedTheme = localStorage.getItem('theme-color');
    return (savedTheme as ThemeColor) || 'blue';
  });

  // Get initial mode from localStorage or system preference
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode === 'dark' || savedMode === 'light') {
      return savedMode;
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Initialize theme variables on mount
  useEffect(() => {
    initializeThemeVariables(theme, mode);
  }, []);

  // Save theme to localStorage when it changes and update CSS variables
  useEffect(() => {
    localStorage.setItem('theme-color', theme);
    
    // Update CSS variables for the theme
    const root = document.documentElement;
    const themeColorSet = themeColors[theme];
    
    root.style.setProperty('--primary-color', themeColorSet.primary);
    root.style.setProperty('--primary-color-light', themeColorSet.accent);
    root.style.setProperty('--primary-color-dark', themeColorSet.secondary);
    root.style.setProperty('--secondary-color', themeColorSet.secondary);
    root.style.setProperty('--accent-color', themeColorSet.accent);
  }, [theme]);

  // Save mode to localStorage when it changes and update document class
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    
    // Apply dark mode class to document
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  // Set theme with validation
  const setTheme = (newTheme: ThemeColor) => {
    if (themeColors[newTheme]) {
      setThemeState(newTheme);
    } else {
      console.warn(`Theme "${newTheme}" is not a valid theme.`);
    }
  };

  // Set mode with validation
  const setMode = (newMode: ThemeMode) => {
    if (newMode === 'light' || newMode === 'dark') {
      setModeState(newMode);
    } else {
      console.warn(`Mode "${newMode}" is not a valid mode.`);
    }
  };

  // Toggle between light and dark mode
  const toggleMode = () => {
    setModeState(prevMode => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  return {
    theme,
    mode,
    setTheme,
    setMode,
    toggleMode,
    isDark: mode === 'dark',
  };
};

/**
 * Helper function to get status color based on status type
 */
export const getStatusColor = (status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'error' | 'info') => {
  switch(status) {
    case 'active':
    case 'success':
      return {
        bg: semanticColors.status.success.light,
        text: semanticColors.status.success.foreground,
      };
    case 'inactive':
      return {
        bg: semanticColors.status.neutral.light,
        text: semanticColors.status.neutral.foreground,
      };
    case 'pending':
    case 'warning':
      return {
        bg: semanticColors.status.warning.light,
        text: semanticColors.status.warning.foreground,
      };
    case 'error':
      return {
        bg: semanticColors.status.error.light,
        text: semanticColors.status.error.foreground,
      };
    case 'info':
      return {
        bg: semanticColors.status.info.light,
        text: semanticColors.status.info.foreground,
      };
    default:
      return {
        bg: semanticColors.status.neutral.light,
        text: semanticColors.status.neutral.foreground,
      };
  }
};

/**
 * Helper function to generate CSS variables for the theme
 * This can be used to initialize the theme on application load
 */
export const generateThemeCssVariables = (theme: ThemeColor, mode: ThemeMode): Record<string, string> => {
  const themeColorSet = themeColors[theme];
  const baseModeColors = mode === 'dark' ? {
    background: '#1e1e2f',
    foreground: '#ffffff',
    muted: '#2d2d3f',
    border: '#2d2d3f',
  } : {
    background: semanticColors.app.background,
    foreground: semanticColors.app.foreground,
    muted: semanticColors.app.muted,
    border: semanticColors.app.border,
  };

  return {
    '--primary-color': themeColorSet.primary,
    '--secondary-color': themeColorSet.secondary,
    '--accent-color': themeColorSet.accent,
    '--background-color': baseModeColors.background,
    '--foreground-color': baseModeColors.foreground,
    '--muted-color': baseModeColors.muted,
    '--border-color': baseModeColors.border,
  };
}; 