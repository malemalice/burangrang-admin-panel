import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import settingsService from '../services/settingsService';
import { ThemeColor, ThemeMode } from '@/core/lib/theme';

interface SettingsState {
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  [key: string]: string | boolean | number;
}

/**
 * Custom hook for managing application settings
 */
export const useSettings = () => {
  const [settings, setSettings] = useState<SettingsState>({
    themeColor: 'blue',
    themeMode: 'light',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch theme settings from backend
  const fetchThemeSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const themeSettings = await settingsService.getThemeSettings();
      setSettings({
        themeColor: themeSettings.color,
        themeMode: themeSettings.mode,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch theme settings';
      setError(errorMessage);
      // Don't show toast error for theme loading failures - they fall back to defaults
      console.warn('Failed to load theme settings from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get a specific setting value
  const getSetting = async (key: string): Promise<string | null> => {
    try {
      return await settingsService.getSettingValue(key);
    } catch (err) {
      console.warn(`Failed to get setting ${key}:`, err);
      return null;
    }
  };

  // Set a specific setting value
  const setSetting = async (key: string, value: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      await settingsService.setSettingValue(key, value);

      // Update local state if it's a theme setting
      if (key === 'theme.color') {
        setSettings(prev => ({ ...prev, themeColor: value as ThemeColor }));
      } else if (key === 'theme.mode') {
        setSettings(prev => ({ ...prev, themeMode: value as ThemeMode }));
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to update setting ${key}`;
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Update theme settings
  const updateThemeSettings = async (color: ThemeColor, mode: ThemeMode) => {
    setIsUpdating(true);
    setError(null);
    try {
      await settingsService.setThemeSettings(color, mode);
      setSettings(prev => ({
        ...prev,
        themeColor: color,
        themeMode: mode,
      }));
      toast.success('Theme settings updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update theme settings';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Load theme settings on mount
  useEffect(() => {
    fetchThemeSettings();
  }, []);

  return {
    settings,
    isLoading,
    isUpdating,
    error,
    fetchThemeSettings,
    getSetting,
    setSetting,
    updateThemeSettings,
  };
};

/**
 * Custom hook for managing app name setting
 */
export const useAppName = () => {
  const [appName, setAppName] = useState<string>('Office Nexus');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch app name from backend
  const fetchAppName = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const name = await settingsService.getAppName();
      setAppName(name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch app name';
      setError(errorMessage);
      console.warn('Failed to load app name from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update app name
  const updateAppName = async (newName: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      await settingsService.setAppName(newName);
      setAppName(newName);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update app name';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Load app name on mount
  useEffect(() => {
    fetchAppName();
  }, []);

  return {
    appName,
    isLoading,
    isUpdating,
    error,
    fetchAppName,
    updateAppName,
  };
};

/**
 * Custom hook for managing document title based on app name
 */
export const useDocumentTitle = (pageTitle?: string) => {
  const { appName } = useAppName();

  useEffect(() => {
    const baseTitle = appName || 'Office Nexus';
    const fullTitle = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle;
    document.title = fullTitle;
  }, [appName, pageTitle]);
};
