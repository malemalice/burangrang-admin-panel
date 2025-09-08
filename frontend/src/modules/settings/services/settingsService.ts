import api from '@/core/lib/api';
import { ThemeColor, ThemeMode } from '@/core/lib/theme';

/**
 * Settings service for managing application settings via backend
 */
const settingsService = {
  // Get setting value by key with retry limit
  getSettingValue: async (key: string, retryCount: number = 0): Promise<string | null> => {
    const MAX_RETRIES = 1; // Only retry once to prevent infinite loops

    try {
      const response = await api.get(`/settings/value/${key}`);
      return response.data.value;
    } catch (error: any) {
      // Handle 404 (setting not found) gracefully
      if (error.response?.status === 404) {
        console.log(`Setting ${key} not found, returning null`);
        return null;
      }
      // Handle 403 (permission denied) by returning null for theme settings
      if (error.response?.status === 403 && key.startsWith('theme.')) {
        console.log(`Permission denied for theme setting ${key}, returning null`);
        return null;
      }
      // Handle 403 for non-theme settings - don't retry
      if (error.response?.status === 403) {
        console.warn(`403 Forbidden for setting ${key}, not retrying`);
        return null;
      }
      // Handle 401 (unauthorized) - retry once if we haven't exceeded limit
      if (error.response?.status === 401 && retryCount < MAX_RETRIES) {
        console.log(`401 Unauthorized for setting ${key}, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return settingsService.getSettingValue(key, retryCount + 1);
      }

      console.error(`Error fetching setting ${key}:`, error);
      return null;
    }
  },

  // Set setting value by key
  setSettingValue: async (key: string, value: string): Promise<void> => {
    try {
      await api.patch(`/settings/by-key/${key}`, { value });
    } catch (error: any) {
      // Handle 404 (setting not found) by creating the setting first
      if (error.response?.status === 404) {
        try {
          console.log(`Setting ${key} not found, creating it first`);
          await api.post('/settings', { key, value, isActive: true });
          return;
        } catch (createError: any) {
          console.error(`Error creating setting ${key}:`, createError);
          throw new Error(`Failed to create setting ${key}`);
        }
      }
      // Handle 403 (permission denied) by silently failing for theme settings
      if (error.response?.status === 403 && key.startsWith('theme.')) {
        console.log(`Permission denied for theme setting ${key}, skipping update`);
        return;
      }
      console.error(`Error updating setting ${key}:`, error);
      const errorMessage = error.response?.data?.message || `Failed to update setting ${key}`;
      throw new Error(errorMessage);
    }
  },

  // Get theme color setting
  getThemeColor: async (): Promise<ThemeColor> => {
    try {
      const response = await api.get('/settings/theme');
      return (response.data.color as ThemeColor) || 'blue';
    } catch (error: any) {
      console.warn('Failed to get theme color, using default:', error);
      return 'blue';
    }
  },

  // Set theme color setting
  setThemeColor: async (themeColor: ThemeColor): Promise<void> => {
    try {
      await api.patch('/settings/theme/color', { color: themeColor });
    } catch (error: any) {
      // Don't throw 401 errors as they are expected when not authenticated
      if (error?.response?.status !== 401) {
        console.warn('Failed to set theme color:', error);
        throw error;
      }
      // Silently handle 401 errors
    }
  },

  // Get theme mode setting
  getThemeMode: async (): Promise<ThemeMode> => {
    try {
      const response = await api.get('/settings/theme');
      return (response.data.mode as ThemeMode) || 'light';
    } catch (error: any) {
      console.warn('Failed to get theme mode, using default:', error);
      return 'light';
    }
  },

  // Set theme mode setting
  setThemeMode: async (themeMode: ThemeMode): Promise<void> => {
    try {
      await api.patch('/settings/theme/mode', { mode: themeMode });
    } catch (error: any) {
      // Don't throw 401 errors as they are expected when not authenticated
      if (error?.response?.status !== 401) {
        console.warn('Failed to set theme mode:', error);
        throw error;
      }
      // Silently handle 401 errors
    }
  },

  // Get all theme settings
  getThemeSettings: async (): Promise<{ color: ThemeColor; mode: ThemeMode }> => {
    try {
      const response = await api.get('/settings/theme');
      return {
        color: (response.data.color as ThemeColor) || 'blue',
        mode: (response.data.mode as ThemeMode) || 'light'
      };
    } catch (error: any) {
      // Don't log 401 errors as they are expected when not authenticated
      if (error?.response?.status !== 401) {
        console.warn('Failed to get theme settings, using defaults:', error);
      }
      return { color: 'blue', mode: 'light' };
    }
  },

  // Set both theme settings at once
  setThemeSettings: async (color: ThemeColor, mode: ThemeMode): Promise<void> => {
    await Promise.all([
      settingsService.setThemeColor(color),
      settingsService.setThemeMode(mode)
    ]);
  },

  // Get all settings (for admin management)
  getAllSettings: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

      const response = await api.get(`/settings?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch settings';
      throw new Error(errorMessage);
    }
  },

  // Create new setting (admin only)
  createSetting: async (setting: { key: string; value: string; isActive?: boolean }) => {
    try {
      const response = await api.post('/settings', setting);
      return response.data;
    } catch (error: any) {
      console.error('Error creating setting:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create setting';
      throw new Error(errorMessage);
    }
  },

  // Update setting by ID (admin only)
  updateSetting: async (id: string, updates: { key?: string; value?: string; isActive?: boolean }) => {
    try {
      const response = await api.patch(`/settings/${id}`, updates);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating setting ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to update setting';
      throw new Error(errorMessage);
    }
  },

  // Delete setting by ID (admin only)
  deleteSetting: async (id: string) => {
    try {
      await api.delete(`/settings/${id}`);
    } catch (error: any) {
      console.error(`Error deleting setting ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to delete setting';
      throw new Error(errorMessage);
    }
  }
};

export default settingsService;
