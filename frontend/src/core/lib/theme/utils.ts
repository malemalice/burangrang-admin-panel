import { useState, useEffect } from 'react';
import { themeColors, themeColorsHSL, semanticColors, baseColors } from './colors';
import { useAuth } from '@/core/lib/auth';

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
 * 
 * In dark mode, theme colors (primary, secondary, accent) are ignored
 * and replaced with neutral dark mode colors following industry best practices
 */
export const initializeThemeVariables = (theme: ThemeColor = 'blue', mode: ThemeMode = 'light'): void => {
  const root = document.documentElement;

  // Set mode-specific colors
  if (mode === 'light') {
    // Light mode: Use theme colors
    const themeColorSet = themeColorsHSL[theme];
    root.style.setProperty('--primary', themeColorSet.primary);
    root.style.setProperty('--secondary', themeColorSet.secondary);
    root.style.setProperty('--accent', themeColorSet.accent);

    // Light mode base colors
    root.style.setProperty('--background', '0 0% 100%');
    root.style.setProperty('--foreground', '222.2 84% 4.9%');
    root.style.setProperty('--muted', '210 40% 96.1%');
    root.style.setProperty('--border', '214.3 31.8% 91.4%');
    root.style.setProperty('--input', '214.3 31.8% 91.4%');
    root.style.setProperty('--ring', '222.2 84% 4.9%');
    root.style.setProperty('--card', '0 0% 100%');
    root.style.setProperty('--popover', '0 0% 100%');
    
    // Primary foreground for light mode
    root.style.setProperty('--primary-foreground', '210 40% 98%');
    root.style.setProperty('--secondary-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
    
    // Sidebar colors for light mode (use theme colors)
    root.style.setProperty('--sidebar-background', '0 0% 98%');
    root.style.setProperty('--sidebar-foreground', '240 5.3% 26.1%');
    root.style.setProperty('--sidebar-primary', themeColorSet.primary);
    root.style.setProperty('--sidebar-primary-foreground', '0 0% 98%');
    root.style.setProperty('--sidebar-accent', '240 4.8% 95.9%');
    root.style.setProperty('--sidebar-accent-foreground', '240 5.9% 10%');
    root.style.setProperty('--sidebar-border', '220 13% 91%');
    root.style.setProperty('--sidebar-ring', '217.2 91.2% 59.8%');
  } else {
    // Dark mode: Use neutral colors, ignore theme colors
    // Following industry best practices for dark mode
    root.style.setProperty('--primary', '210 40% 98%'); // Light neutral for primary actions
    root.style.setProperty('--secondary', '217.2 32.6% 17.5%'); // Dark neutral for secondary
    root.style.setProperty('--accent', '217.2 32.6% 17.5%'); // Dark neutral for accent
    
    // Dark mode base colors
    root.style.setProperty('--background', '222.2 84% 4.9%');
    root.style.setProperty('--foreground', '210 40% 98%');
    root.style.setProperty('--muted', '217.2 32.6% 17.5%');
    root.style.setProperty('--border', '217.2 32.6% 17.5%');
    root.style.setProperty('--input', '217.2 32.6% 17.5%');
    root.style.setProperty('--ring', '212.7 26.8% 83.9%');
    root.style.setProperty('--card', '222.2 84% 4.9%');
    root.style.setProperty('--popover', '222.2 84% 4.9%');
    
    // Primary foreground for dark mode
    root.style.setProperty('--primary-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--secondary-foreground', '210 40% 98%');
    root.style.setProperty('--accent-foreground', '210 40% 98%');
    
    // Sidebar colors for dark mode (neutral dark)
    root.style.setProperty('--sidebar-background', '240 5.9% 10%');
    root.style.setProperty('--sidebar-foreground', '240 4.8% 95.9%');
    root.style.setProperty('--sidebar-primary', '210 40% 98%'); // Light neutral for active items
    root.style.setProperty('--sidebar-primary-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--sidebar-accent', '240 3.7% 15.9%');
    root.style.setProperty('--sidebar-accent-foreground', '240 4.8% 95.9%');
    root.style.setProperty('--sidebar-border', '240 3.7% 15.9%');
    root.style.setProperty('--sidebar-ring', '212.7 26.8% 83.9%');
  }

  // Status colors (same for both modes)
  root.style.setProperty('--destructive', mode === 'light' ? '0 84.2% 60.2%' : '0 62.8% 30.6%');
  root.style.setProperty('--destructive-foreground', '210 40% 98%');
  
  // Muted foreground
  root.style.setProperty('--muted-foreground', mode === 'light' ? '215.4 16.3% 46.9%' : '215 20.2% 65.1%');
  
  // Set radius for consistent border radius
  root.style.setProperty('--radius', '0.5rem');
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
  isLoading: boolean;
  loadThemeFromBackend: () => Promise<{ color: ThemeColor; mode: ThemeMode }>;
}

/**
 * Hook for managing theme in the application with backend persistence
 */
export const useTheme = (): UseThemeReturn => {
  // Loading state for backend operations
  const [isLoading, setIsLoading] = useState(false);

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

  // Function to load theme settings from backend
  const loadThemeFromBackend = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated before making API calls
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.debug('User not authenticated, skipping backend theme load');
        return { color: theme, mode };
      }

      // Dynamically import settings service to avoid circular dependencies
      const { default: settingsService } = await import('@/modules/settings/services/settingsService');

      const themeSettings = await settingsService.getThemeSettings();

      // Update state with backend values
      setThemeState(themeSettings.color);
      setModeState(themeSettings.mode);

      // Update localStorage as fallback
      localStorage.setItem('theme-color', themeSettings.color);
      localStorage.setItem('theme-mode', themeSettings.mode);

      // Initialize CSS variables immediately to ensure proper colors are applied
      // The effects will also run, but this ensures immediate consistency
      initializeThemeVariables(themeSettings.color, themeSettings.mode);

      return themeSettings;
    } catch (error: any) {
      // Don't log 401 errors as they are expected when not authenticated
      if (error?.response?.status !== 401) {
        console.warn('Failed to load theme from backend, using localStorage defaults:', error);
      }
      // Continue with localStorage values if backend fails
      return { color: theme, mode };
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save theme settings to backend
  const saveThemeToBackend = async (newTheme: ThemeColor, newMode: ThemeMode) => {
    try {
      // Check if user is authenticated before making API calls
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.debug('User not authenticated, skipping backend theme save');
        return;
      }

      // Dynamically import settings service to avoid circular dependencies
      const { default: settingsService } = await import('@/modules/settings/services/settingsService');

      await settingsService.setThemeSettings(newTheme, newMode);
    } catch (error: any) {
      // Don't log 401 errors as they are expected when not authenticated
      if (error?.response?.status !== 401) {
        console.warn('Failed to save theme to backend:', error);
      }
      // Don't throw error - localStorage will still work as fallback
    }
  };

  // Save theme to localStorage when it changes and update CSS variables
  useEffect(() => {
    localStorage.setItem('theme-color', theme);

    // Only apply theme colors in light mode
    // In dark mode, use neutral colors (handled in mode effect)
    if (mode === 'light') {
    const root = document.documentElement;
    const themeColorSet = themeColorsHSL[theme];

    // Set primary colors in HSL format for Tailwind CSS
    root.style.setProperty('--primary', themeColorSet.primary);
    root.style.setProperty('--secondary', themeColorSet.secondary);
    root.style.setProperty('--accent', themeColorSet.accent);
    }

    // Save to backend (don't await to avoid blocking UI)
    saveThemeToBackend(theme, mode);
  }, [theme, mode]);

  // Save mode to localStorage when it changes and update document class
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);

    // Apply dark mode class to document
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update ALL CSS variables based on mode using initializeThemeVariables
    // This ensures all variables are properly set, including those that might conflict with static CSS
    initializeThemeVariables(theme, mode);

    // Save to backend (don't await to avoid blocking UI)
    saveThemeToBackend(theme, mode);
  }, [mode, theme]);

  // Set theme with validation
  const setTheme = (newTheme: ThemeColor) => {
    if (themeColorsHSL[newTheme]) {
      setThemeState(newTheme);

      // Only apply theme colors in light mode
      // In dark mode, neutral colors are used (handled by mode effect)
      if (mode === 'light') {
      const root = document.documentElement;
      const themeColorSet = themeColorsHSL[newTheme];

      // Set primary colors in HSL format
      root.style.setProperty('--primary', themeColorSet.primary);
      root.style.setProperty('--secondary', themeColorSet.secondary);
      root.style.setProperty('--accent', themeColorSet.accent);

      console.log(`Applied theme ${newTheme}:`, themeColorSet);
      } else {
        console.log(`Theme ${newTheme} saved but not applied (dark mode uses neutral colors)`);
      }
    } else {
      console.warn(`Theme "${newTheme}" is not a valid theme.`);
    }
  };

  // Set mode with validation
  const setMode = (newMode: ThemeMode) => {
    if (newMode === 'light' || newMode === 'dark') {
      setModeState(newMode);

      // Apply dark mode class immediately for instant feedback
      const root = document.documentElement;
      
      if (newMode === 'dark') {
        document.documentElement.classList.add('dark');
        
        // Apply neutral colors for dark mode
        root.style.setProperty('--primary', '210 40% 98%');
        root.style.setProperty('--secondary', '217.2 32.6% 17.5%');
        root.style.setProperty('--accent', '217.2 32.6% 17.5%');
        root.style.setProperty('--primary-foreground', '222.2 47.4% 11.2%');
        root.style.setProperty('--secondary-foreground', '210 40% 98%');
        root.style.setProperty('--accent-foreground', '210 40% 98%');
        root.style.setProperty('--destructive', '0 62.8% 30.6%');
        root.style.setProperty('--muted-foreground', '215 20.2% 65.1%');
        
        console.log('Applied dark mode with neutral colors');
      } else {
        document.documentElement.classList.remove('dark');
        
        // Apply theme colors for light mode
        const themeColorSet = themeColorsHSL[theme];
        root.style.setProperty('--primary', themeColorSet.primary);
        root.style.setProperty('--secondary', themeColorSet.secondary);
        root.style.setProperty('--accent', themeColorSet.accent);
        root.style.setProperty('--primary-foreground', '210 40% 98%');
        root.style.setProperty('--secondary-foreground', '222.2 47.4% 11.2%');
        root.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
        root.style.setProperty('--destructive', '0 84.2% 60.2%');
        root.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
        
        console.log('Applied light mode with theme colors');
      }
    } else {
      console.warn(`Mode "${newMode}" is not a valid mode.`);
    }
  };

  // Toggle between light and dark mode
  const toggleMode = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode); // Use setMode to ensure proper color updates
  };

  return {
    theme,
    mode,
    setTheme,
    setMode,
    toggleMode,
    isDark: mode === 'dark',
    isLoading,
    loadThemeFromBackend,
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