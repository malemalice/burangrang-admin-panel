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

export interface AppBrandingSettings {
  name: string;
  logoPortraitUrl: string | null;
  logoLandscapeUrl: string | null;
  loginTagline: string | null;
}

export const withCacheBust = (url: string, version?: number) => {
  if (!url) return url;
  if (!version) return url;
  const hasQuery = url.includes('?');
  return `${url}${hasQuery ? '&' : '?'}v=${version}`;
};

/**
 * Custom hook for app branding (name + logos).
 * Uses the public `/settings/app` endpoint so it can be used on Login page too.
 */
export const useAppBranding = (options?: { cacheBustVersion?: number }) => {
  const [branding, setBranding] = useState<AppBrandingSettings>({
    name: 'HSE System',
    logoPortraitUrl: null,
    logoLandscapeUrl: null,
    loginTagline: 'made by your company',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const app = await settingsService.getAppSettings();
      setBranding(app);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch app branding';
      setError(errorMessage);
      console.warn('Failed to load app branding from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  const cacheBustVersion = options?.cacheBustVersion;
  const logoPortraitUrl = branding.logoPortraitUrl
    ? withCacheBust(branding.logoPortraitUrl, cacheBustVersion)
    : null;
  const logoLandscapeUrl = branding.logoLandscapeUrl
    ? withCacheBust(branding.logoLandscapeUrl, cacheBustVersion)
    : null;

  return {
    branding,
    appName: branding.name,
    logoPortraitUrl,
    logoLandscapeUrl,
    loginTagline: branding.loginTagline || 'made by your company',
    isLoading,
    error,
    fetchBranding,
  };
};

/**
 * Custom hook for managing app name setting
 */
export const useAppName = () => {
  const [appName, setAppName] = useState<string>('HSE System');
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
    const baseTitle = appName || 'HSE System';
    const fullTitle = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle;
    document.title = fullTitle;
  }, [appName, pageTitle]);
};
