import { PermissionDto } from '../../../modules/permissions/dto/permission.dto';
import { DataLevelEnum } from '@prisma/client';

export class RoleDto {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  dataLevel: DataLevelEnum;
  permissions?: PermissionDto[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RoleDto>) {
    Object.assign(this, partial);
  }
}
