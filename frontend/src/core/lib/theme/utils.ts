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
 */
export const initializeThemeVariables = (theme: ThemeColor = 'blue', mode: ThemeMode = 'light'): void => {
  const root = document.documentElement;
  const themeColorSet = themeColorsHSL[theme];

  // Set theme-specific colors in HSL format for Tailwind CSS
  root.style.setProperty('--primary', themeColorSet.primary);
  root.style.setProperty('--secondary', themeColorSet.secondary);
  root.style.setProperty('--accent', themeColorSet.accent);

  // Set mode-specific colors
  if (mode === 'light') {
    // Light mode colors
    root.style.setProperty('--background', '0 0% 100%');
    root.style.setProperty('--foreground', '222.2 84% 4.9%');
    root.style.setProperty('--muted', '210 40% 96.1%');
    root.style.setProperty('--border', '214.3 31.8% 91.4%');
    root.style.setProperty('--input', '214.3 31.8% 91.4%');
    root.style.setProperty('--ring', '222.2 84% 4.9%');
    root.style.setProperty('--card', '0 0% 100%');
    root.style.setProperty('--popover', '0 0% 100%');
  } else {
    // Dark mode colors
    root.style.setProperty('--background', '222.2 84% 4.9%');
    root.style.setProperty('--foreground', '210 40% 98%');
    root.style.setProperty('--muted', '217.2 32.6% 17.5%');
    root.style.setProperty('--border', '217.2 32.6% 17.5%');
    root.style.setProperty('--input', '217.2 32.6% 17.5%');
    root.style.setProperty('--ring', '212.7 26.8% 83.9%');
    root.style.setProperty('--card', '222.2 84% 4.9%');
    root.style.setProperty('--popover', '222.2 84% 4.9%');
  }

  // Status colors (same for both modes)
  root.style.setProperty('--destructive', '0 84.2% 60.2%');
  
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

    // Update CSS variables for the theme
    const root = document.documentElement;
    const themeColorSet = themeColorsHSL[theme];

    // Set primary colors in HSL format for Tailwind CSS
    root.style.setProperty('--primary', themeColorSet.primary);
    root.style.setProperty('--secondary', themeColorSet.secondary);
    root.style.setProperty('--accent', themeColorSet.accent);

    // Save to backend (don't await to avoid blocking UI)
    saveThemeToBackend(theme, mode);
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

    // Save to backend (don't await to avoid blocking UI)
    saveThemeToBackend(theme, mode);
  }, [mode]);

  // Set theme with validation
  const setTheme = (newTheme: ThemeColor) => {
    if (themeColorsHSL[newTheme]) {
      setThemeState(newTheme);

      // Apply CSS variables immediately for instant feedback
      // Use HSL values and correct variable names for Tailwind CSS
      const root = document.documentElement;
      const themeColorSet = themeColorsHSL[newTheme];

      // Set primary colors in HSL format
      root.style.setProperty('--primary', themeColorSet.primary);
      root.style.setProperty('--secondary', themeColorSet.secondary);
      root.style.setProperty('--accent', themeColorSet.accent);

      console.log(`Applied theme ${newTheme}:`, themeColorSet);
    } else {
      console.warn(`Theme "${newTheme}" is not a valid theme.`);
    }
  };

  // Set mode with validation
  const setMode = (newMode: ThemeMode) => {
    if (newMode === 'light' || newMode === 'dark') {
      setModeState(newMode);

      // Apply dark mode class immediately for instant feedback
      if (newMode === 'dark') {
        document.documentElement.classList.add('dark');
        console.log('Applied dark mode');
      } else {
        document.documentElement.classList.remove('dark');
        console.log('Applied light mode');
      }
    } else {
      console.warn(`Mode "${newMode}" is not a valid mode.`);
    }
  };

  // Toggle between light and dark mode
  const toggleMode = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setModeState(newMode);

    // Apply dark mode class immediately for instant feedback
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('Toggled to dark mode');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Toggled to light mode');
    }
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