import { ApiProperty } from '@nestjs/swagger';

export class JobPositionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(partial: Partial<JobPositionDto>) {
    Object.assign(this, partial);
  }
}

export class DepartmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(partial: Partial<DepartmentDto>) {
    Object.assign(this, partial);
  }
}

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}

export class MasterApprovalItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mApprovalId: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  job_position_id: string;

  @ApiProperty()
  department_id: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => JobPositionDto })
  jobPosition: JobPositionDto;

  @ApiProperty({ type: () => DepartmentDto })
  department: DepartmentDto;

  @ApiProperty({ type: () => UserDto })
  creator: UserDto;

  constructor(partial: Partial<MasterApprovalItemDto>) {
    Object.assign(this, partial);
  }
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

  constructor(partial: Partial<MasterApprovalDto>) {
    Object.assign(this, partial);
  }
}
