import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useTheme as useThemeHook, ThemeColor, ThemeMode, initializeThemeVariables } from './utils';

// Define the theme context type
interface ThemeContextType {
  theme: ThemeColor;
  mode: ThemeMode;
  setTheme: (theme: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
  isLoading: boolean;
  loadThemeFromBackend: () => Promise<{ color: ThemeColor; mode: ThemeMode }>;
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeColor;
  defaultMode?: ThemeMode;
}

/**
 * Theme Provider component
 * Provides theme context to the entire application
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'blue',
  defaultMode = 'light',
}) => {
  // Use the theme hook
  const themeValue = useThemeHook();
  
  // Initialize CSS variables when the component mounts
  useEffect(() => {
    // Initialize theme variables when ThemeProvider mounts
    initializeThemeVariables(defaultTheme, defaultMode);

    // Load theme settings from backend on app startup (only once)
    const loadBackendTheme = async () => {
      try {
        if (themeValue.loadThemeFromBackend) {
          await themeValue.loadThemeFromBackend();
        }
      } catch (error) {
        console.warn('Failed to load theme from backend on startup, using defaults:', error);
        // Theme will fall back to localStorage or default values
      }
    };

    // Only load backend theme if user appears to be authenticated
    // Use a flag to prevent multiple calls
    const accessToken = localStorage.getItem('access_token');
    const hasLoadedTheme = sessionStorage.getItem('theme-loaded');

    if (accessToken && !hasLoadedTheme) {
      sessionStorage.setItem('theme-loaded', 'true');
      loadBackendTheme();
    }
  }, []); // Empty dependency array to run only once
  
  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use the theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

/**
 * Theme consumer component for class components
 */
export const ThemeConsumer = ThemeContext.Consumer; 