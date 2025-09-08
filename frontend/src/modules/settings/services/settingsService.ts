import api from '@/core/lib/api';
import { UserSettings, UpdateSettingsRequest } from '../types/settings.types';

/**
 * Settings service for managing user settings
 */
const settingsService = {
  // Get current user settings
  getUserSettings: async (): Promise<UserSettings> => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },

  // Update user settings
  updateSettings: async (settings: UpdateSettingsRequest): Promise<UserSettings> => {
    try {
      const response = await api.patch('/settings', settings);
      return response.data;
    } catch (error: any) {
      console.error('Error updating settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update settings';
      throw new Error(errorMessage);
    }
  },

  // Reset settings to default
  resetSettings: async (): Promise<UserSettings> => {
    try {
      const response = await api.post('/settings/reset');
      return response.data;
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reset settings';
      throw new Error(errorMessage);
    }
  },

  // Export settings data
  exportSettings: async (): Promise<Blob> => {
    try {
      const response = await api.get('/settings/export', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error exporting settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to export settings';
      throw new Error(errorMessage);
    }
  },

  // Import settings data
  importSettings: async (file: File): Promise<UserSettings> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/settings/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error importing settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to import settings';
      throw new Error(errorMessage);
    }
  }
};

export default settingsService;
