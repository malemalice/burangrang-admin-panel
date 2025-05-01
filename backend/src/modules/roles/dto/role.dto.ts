import { PermissionDto } from '../../../modules/permissions/dto/permission.dto';

export class RoleDto {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  permissions?: PermissionDto[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RoleDto>) {
    Object.assign(this, partial);
  }
} 