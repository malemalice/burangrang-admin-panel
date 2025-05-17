import { ApiProperty } from '@nestjs/swagger';

export class MasterApprovalDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entity: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: () => MasterApprovalItemDto, isArray: true })
  items: MasterApprovalItemDto[];
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

  @ApiProperty({ type: () => Object })
  role: any;

  @ApiProperty({ type: () => Object })
  department: any;

  @ApiProperty({ type: () => Object })
  creator: any;
}
