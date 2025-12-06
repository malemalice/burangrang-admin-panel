/**
 * Theme initialization - runs BEFORE React renders
 * This file has NO React dependencies and runs synchronously
 */

// Import colors directly (no React)
import { themeColorsHSL } from './colors';

export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';
export type ThemeMode = 'light' | 'dark';

/**
 * Initialize theme CSS variables immediately
 * This runs synchronously before React renders
 */
export const initializeTheme = (): void => {
  // Ensure document exists (for SSR safety)
  if (typeof document === 'undefined') return;
  
  const savedTheme = (localStorage.getItem('theme-color') as ThemeColor) || 'blue';
  const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
  const initialMode: ThemeMode = 
    (savedMode === 'dark' || savedMode === 'light') 
      ? savedMode 
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  const root = document.documentElement;
  
  // Apply dark class for Tailwind dark: variants
  if (initialMode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Set ALL CSS variables via JavaScript (EXACTLY like theme color)
  if (initialMode === 'light') {
    // Light mode: Use theme colors
    const themeColorSet = themeColorsHSL[savedTheme];
    root.style.setProperty('--primary', themeColorSet.primary);
    root.style.setProperty('--secondary', themeColorSet.secondary);
    root.style.setProperty('--accent', themeColorSet.accent);
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
    root.style.setProperty('--primary-foreground', '210 40% 98%');
    root.style.setProperty('--secondary-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
    root.style.setProperty('--destructive', '0 84.2% 60.2%');
    root.style.setProperty('--destructive-foreground', '210 40% 98%');
    root.style.setProperty('--sidebar-background', '0 0% 98%');
    root.style.setProperty('--sidebar-foreground', '240 5.3% 26.1%');
    root.style.setProperty('--sidebar-primary', themeColorSet.primary);
    root.style.setProperty('--sidebar-primary-foreground', '0 0% 98%');
    root.style.setProperty('--sidebar-accent', '240 4.8% 95.9%');
    root.style.setProperty('--sidebar-accent-foreground', '240 5.9% 10%');
    root.style.setProperty('--sidebar-border', '220 13% 91%');
    root.style.setProperty('--sidebar-ring', '217.2 91.2% 59.8%');
    root.style.setProperty('--radius', '0.5rem');
  } else {
    // Dark mode: Use neutral colors (no theme colors)
    root.style.setProperty('--primary', '210 40% 98%');
    root.style.setProperty('--secondary', '217.2 32.6% 17.5%');
    root.style.setProperty('--accent', '217.2 32.6% 17.5%');
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
    root.style.setProperty('--primary-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--secondary-foreground', '210 40% 98%');
    root.style.setProperty('--accent-foreground', '210 40% 98%');
    root.style.setProperty('--muted-foreground', '215 20.2% 65.1%');
    root.style.setProperty('--destructive', '0 62.8% 30.6%');
    root.style.setProperty('--destructive-foreground', '210 40% 98%');
    root.style.setProperty('--sidebar-background', '240 5.9% 10%');
    root.style.setProperty('--sidebar-foreground', '240 4.8% 95.9%');
    root.style.setProperty('--sidebar-primary', '210 40% 98%');
    root.style.setProperty('--sidebar-primary-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--sidebar-accent', '240 3.7% 15.9%');
    root.style.setProperty('--sidebar-accent-foreground', '240 4.8% 95.9%');
    root.style.setProperty('--sidebar-border', '240 3.7% 15.9%');
    root.style.setProperty('--sidebar-ring', '212.7 26.8% 83.9%');
    root.style.setProperty('--radius', '0.5rem');
  }
  
  console.log('[Theme Init] Initialized:', { theme: savedTheme, mode: initialMode });
};

// Run immediately when this module is imported
initializeTheme();
