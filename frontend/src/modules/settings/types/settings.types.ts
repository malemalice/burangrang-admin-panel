/**
 * Settings module types
 */

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
  };
  preferences: {
    dateFormat: string;
    timeFormat: '12h' | '24h';
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  privacy?: {
    profileVisibility?: 'public' | 'private' | 'friends';
    showEmail?: boolean;
    showPhone?: boolean;
  };
  preferences?: {
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
    timezone?: string;
  };
}

export interface SettingsFormData {
  theme: 'light' | 'dark' | 'system';
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timezone: string;
}
