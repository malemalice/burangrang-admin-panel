/**
 * Settings module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as SettingsPage } from './pages/SettingsPage';

// Routes
export { default as settingsRoutes } from './routes/settingsRoutes';

// Services
export { default as settingsService } from './services/settingsService';

// Types
export type {
  UserSettings,
  UpdateSettingsRequest,
  SettingsFormData,
} from './types/settings.types';

// Hooks
export { useSettings } from './hooks/useSettings';