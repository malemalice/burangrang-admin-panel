import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApprovalStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class CreateApprovalDto {
  @ApiProperty()
  @IsString()
  mApprovalId: string;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty({ enum: ApprovalStatus })
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @ApiProperty()
  @IsString()
  departmentId: string;

  @ApiProperty()
  @IsString()
  jobPositionId: string;

  @ApiProperty()
  @IsString()
  createdBy: string;
} 