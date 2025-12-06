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
 * Uses PURE JavaScript approach (like theme colors) - no CSS class conflicts!
 * Both light and dark mode colors are set via JavaScript setProperty
 */
export const initializeThemeVariables = (theme: ThemeColor = 'blue', mode: ThemeMode = 'light'): void => {
  const root = document.documentElement;
  
  console.log('[initializeThemeVariables] Setting colors via JS:', { theme, mode });

  if (mode === 'light') {
    // Light mode: Use theme colors for primary/secondary/accent
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
    root.style.setProperty('--card-foreground', '222.2 84% 4.9%');
    root.style.setProperty('--popover', '0 0% 100%');
    root.style.setProperty('--popover-foreground', '222.2 84% 4.9%');
    
    // Foregrounds
    root.style.setProperty('--primary-foreground', '210 40% 98%');
    root.style.setProperty('--secondary-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
    
    // Status
    root.style.setProperty('--destructive', '0 84.2% 60.2%');
    root.style.setProperty('--destructive-foreground', '210 40% 98%');
    
    // Sidebar (uses theme color)
    root.style.setProperty('--sidebar-background', '0 0% 98%');
    root.style.setProperty('--sidebar-foreground', '240 5.3% 26.1%');
    root.style.setProperty('--sidebar-primary', themeColorSet.primary);
    root.style.setProperty('--sidebar-primary-foreground', '0 0% 98%');
    root.style.setProperty('--sidebar-accent', '240 4.8% 95.9%');
    root.style.setProperty('--sidebar-accent-foreground', '240 5.9% 10%');
    root.style.setProperty('--sidebar-border', '220 13% 91%');
    root.style.setProperty('--sidebar-ring', '217.2 91.2% 59.8%');
  } else {
    // Dark mode: Use neutral colors (no theme colors)
    root.style.setProperty('--primary', '210 40% 98%');
    root.style.setProperty('--secondary', '217.2 32.6% 17.5%');
    root.style.setProperty('--accent', '217.2 32.6% 17.5%');
    
    // Dark mode base colors
    root.style.setProperty('--background', '222.2 84% 4.9%');
    root.style.setProperty('--foreground', '210 40% 98%');
    root.style.setProperty('--muted', '217.2 32.6% 17.5%');
    root.style.setProperty('--border', '217.2 32.6% 17.5%');
    root.style.setProperty('--input', '217.2 32.6% 17.5%');
    root.style.setProperty('--ring', '212.7 26.8% 83.9%');
    root.style.setProperty('--card', '222.2 84% 4.9%');
    root.style.setProperty('--card-foreground', '210 40% 98%');
    root.style.setProperty('--popover', '222.2 84% 4.9%');
    root.style.setProperty('--popover-foreground', '210 40% 98%');
    
    // Foregrounds
    root.style.setProperty('--primary-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--secondary-foreground', '210 40% 98%');
    root.style.setProperty('--accent-foreground', '210 40% 98%');
    root.style.setProperty('--muted-foreground', '215 20.2% 65.1%');
    
    // Status
    root.style.setProperty('--destructive', '0 62.8% 30.6%');
    root.style.setProperty('--destructive-foreground', '210 40% 98%');
    
    // Sidebar (neutral dark)
    root.style.setProperty('--sidebar-background', '240 5.9% 10%');
    root.style.setProperty('--sidebar-foreground', '240 4.8% 95.9%');
    root.style.setProperty('--sidebar-primary', '210 40% 98%');
    root.style.setProperty('--sidebar-primary-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--sidebar-accent', '240 3.7% 15.9%');
    root.style.setProperty('--sidebar-accent-foreground', '240 4.8% 95.9%');
    root.style.setProperty('--sidebar-border', '240 3.7% 15.9%');
    root.style.setProperty('--sidebar-ring', '212.7 26.8% 83.9%');
  }
  
  // Set radius
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

// Initialize theme immediately on module load to prevent flash of wrong theme
// This runs before React renders anything
(() => {
  const savedTheme = (localStorage.getItem('theme-color') as ThemeColor) || 'blue';
  const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
  const initialMode: ThemeMode = 
    (savedMode === 'dark' || savedMode === 'light') 
      ? savedMode 
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  // Apply dark class immediately if needed
  if (initialMode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  console.log('[Theme Utils Init] Initializing theme:', { theme: savedTheme, mode: initialMode });
  
  // Initialize CSS variables immediately
  initializeThemeVariables(savedTheme, initialMode);
})();

/**
 * Hook for managing theme in the application with backend persistence
 */
export const useTheme = (): UseThemeReturn => {
  // Loading state for backend operations
  const [isLoading, setIsLoading] = useState(false);
  
  // Flag to track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);

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
  
  // Mark that initial mount is complete
  useEffect(() => {
    setIsInitialMount(false);
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
    // Skip on initial mount - IIFE already handled it
    if (isInitialMount) return;
    
    localStorage.setItem('theme-color', theme);

    // Apply theme colors via JavaScript (works for both modes)
    initializeThemeVariables(theme, mode);
    
    console.log('[useEffect theme] Applied theme:', theme, 'mode:', mode);

    // Save to backend (don't await to avoid blocking UI)
    saveThemeToBackend(theme, mode);
  }, [theme, mode, isInitialMount]);

  // Save mode to localStorage when it changes and update document class
  useEffect(() => {
    // Skip on initial mount - IIFE already handled it
    if (isInitialMount) return;
    
    localStorage.setItem('theme-mode', mode);

    // Apply dark mode class for Tailwind dark: variants
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Set all colors via JavaScript
    initializeThemeVariables(theme, mode);

    console.log('[useEffect mode] Applied mode:', mode);

    // Save to backend (don't await to avoid blocking UI)
    saveThemeToBackend(theme, mode);
  }, [mode, theme, isInitialMount]);

  // Set theme with validation
  const setTheme = (newTheme: ThemeColor) => {
    if (themeColorsHSL[newTheme]) {
      setThemeState(newTheme);

      // Apply via JavaScript immediately
      initializeThemeVariables(newTheme, mode);
      
      console.log(`Applied theme ${newTheme} in ${mode} mode`);
    } else {
      console.warn(`Theme "${newTheme}" is not a valid theme.`);
    }
  };

  // Set mode with validation
  const setMode = (newMode: ThemeMode) => {
    if (newMode === 'light' || newMode === 'dark') {
      setModeState(newMode);

      // Apply dark class for Tailwind dark: variants
      if (newMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Set all colors via JavaScript
      initializeThemeVariables(theme, newMode);
      
      console.log(`Applied ${newMode} mode`);
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