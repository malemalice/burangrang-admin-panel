import api from '@/lib/api';
import { AxiosResponse } from 'axios';

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
}

export class RoleService {
  constructor(private api = api) {}

  async getDefaultPermissions(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get('/permissions/default-permissions');
    return response.data;
  }

  async getPermissions(): Promise<Permission[]> {
    const response: AxiosResponse<Permission[]> = await this.api.get('/permissions');
    return response.data;
  }

  formatPermissionName(permission: Permission): string {
    return `${permission.module}:${permission.action}`;
  }

  parsePermissionName(name: string): { module: string; action: string } {
    const [module, action] = name.split(':');
    return { module, action };
  }
} 