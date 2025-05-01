import { RoleDto } from '../../../modules/roles/dto/role.dto';

export class MenuDto {
  id: string;
  name: string;
  path?: string | null;
  icon?: string | null;
  parentId?: string | null;
  parent?: MenuDto | null;
  children?: Partial<MenuDto>[];
  order: number;
  isActive: boolean;
  roles: RoleDto[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MenuDto>) {
    Object.assign(this, partial);
  }
} 