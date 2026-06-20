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
  defaultTheme = 'navy',
  defaultMode = 'light',
}) => {
  // Use the theme hook
  const themeValue = useThemeHook();
  
  // Initialize CSS variables when the component mounts
  useEffect(() => {
    const loadBackendTheme = async () => {
      const hasLoadedTheme = sessionStorage.getItem('theme-loaded');

      if (hasLoadedTheme) return;

      try {
        sessionStorage.setItem('theme-loaded', 'true');
        if (themeValue.loadThemeFromBackend) {
          await themeValue.loadThemeFromBackend();
        }
      } catch (error) {
        // Theme will fall back to localStorage or default values
      }
    };

    // Load on mount if already authenticated
    loadBackendTheme();

    // Re-load after login (ThemeProvider is outside AuthProvider so it can't use useAuth)
    window.addEventListener('auth:login', loadBackendTheme);
    return () => window.removeEventListener('auth:login', loadBackendTheme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
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