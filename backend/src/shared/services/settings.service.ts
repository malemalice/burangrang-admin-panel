import { Injectable } from '@nestjs/common';
import { SettingsService } from '../../modules/settings/settings.service';

@Injectable()
export class SettingsHelperService {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get setting value by key
   * @param key The setting key
   * @returns The setting value or null if not found
   */
  async get(key: string): Promise<string | null> {
    return this.settingsService.getValueByKey(key);
  }

  /**
   * Get setting value by key or throw error if not found
   * @param key The setting key
   * @returns The setting value
   */
  async getOrThrow(key: string): Promise<string> {
    return this.settingsService.getValueByKeyOrThrow(key);
  }

  /**
   * Get setting value by key with default fallback
   * @param key The setting key
   * @param defaultValue Default value if setting not found
   * @returns The setting value or default value
   */
  async getWithDefault(key: string, defaultValue: string): Promise<string> {
    try {
      const value = await this.settingsService.getValueByKey(key);
      return value ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Get setting value as boolean
   * @param key The setting key
   * @param defaultValue Default boolean value
   * @returns The setting value as boolean
   */
  async getBoolean(
    key: string,
    defaultValue: boolean = false,
  ): Promise<boolean> {
    try {
      const value = await this.settingsService.getValueByKey(key);
      if (value === null) return defaultValue;
      return value.toLowerCase() === 'true' || value === '1';
    } catch {
      return defaultValue;
    }
  }

  /**
   * Get setting value as number
   * @param key The setting key
   * @param defaultValue Default number value
   * @returns The setting value as number
   */
  async getNumber(key: string, defaultValue: number = 0): Promise<number> {
    try {
      const value = await this.settingsService.getValueByKey(key);
      if (value === null) return defaultValue;
      const num = parseFloat(value);
      return isNaN(num) ? defaultValue : num;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Get setting value as JSON object
   * @param key The setting key
   * @param defaultValue Default object value
   * @returns The setting value parsed as JSON
   */
  async getJson<T = any>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await this.settingsService.getValueByKey(key);
      if (value === null) return defaultValue;
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }
}
