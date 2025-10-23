import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RoleDto } from '../../../modules/roles/dto/role.dto';

export class MenuDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false })
  @Expose()
  path?: string | null;

  @ApiProperty({ required: false })
  @Expose()
  icon?: string | null;

  @ApiProperty({ required: false })
  @Expose()
  parentId?: string | null;

  @ApiProperty({ required: false, type: () => MenuDto })
  @Expose()
  parent?: MenuDto | null;

  @ApiProperty({ required: false, type: [MenuDto] })
  @Expose()
  children?: Partial<MenuDto>[];

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty({ type: [RoleDto] })
  @Expose()
  roles: RoleDto[];

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<MenuDto>) {
    Object.assign(this, partial);
  }
}
