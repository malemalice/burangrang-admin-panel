import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class DepartmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class MasterApprovalItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mApprovalId: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  role_id: string;

  @ApiProperty()
  department_id: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => RoleDto })
  role: RoleDto;

  @ApiProperty({ type: () => DepartmentDto })
  department: DepartmentDto;

  @ApiProperty({ type: () => UserDto })
  creator: UserDto;
}

export class MasterApprovalDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entity: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: () => MasterApprovalItemDto, isArray: true })
  items: MasterApprovalItemDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
