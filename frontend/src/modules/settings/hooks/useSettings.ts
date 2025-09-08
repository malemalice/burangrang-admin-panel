import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import settingsService from '../services/settingsService';
import { UserSettings, UpdateSettingsRequest } from '../types/settings.types';

/**
 * Custom hook for managing user settings
 */
export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user settings
  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userSettings = await settingsService.getUserSettings();
      setSettings(userSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(errorMessage);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Update settings
  const updateSettings = async (updates: UpdateSettingsRequest) => {
    setIsUpdating(true);
    setError(null);
    try {
      const updatedSettings = await settingsService.updateSettings(updates);
      setSettings(updatedSettings);
      toast.success('Settings updated successfully');
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset settings to default
  const resetSettings = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      const resetSettings = await settingsService.resetSettings();
      setSettings(resetSettings);
      toast.success('Settings reset to default');
      return resetSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  // Export settings
  const exportSettings = async () => {
    try {
      const blob = await settingsService.exportSettings();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'settings-export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Settings exported successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export settings';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Import settings
  const importSettings = async (file: File) => {
    setIsUpdating(true);
    setError(null);
    try {
      const importedSettings = await settingsService.importSettings(file);
      setSettings(importedSettings);
      toast.success('Settings imported successfully');
      return importedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import settings';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    isUpdating,
    error,
    fetchSettings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  };
};
