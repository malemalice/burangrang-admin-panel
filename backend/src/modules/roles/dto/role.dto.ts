import { Expose } from 'class-transformer';
import { PermissionDto } from '../../../modules/permissions/dto/permission.dto';

export class RoleDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string | null;

  @Expose()
  isActive: boolean;

  @Expose()
  permissions?: PermissionDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<RoleDto>) {
    Object.assign(this, partial);
  }
}
