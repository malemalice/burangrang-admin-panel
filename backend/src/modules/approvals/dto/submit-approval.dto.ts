import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum ApprovalStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class SubmitApprovalDto {
  @ApiProperty({
    description: 'ID of the entity being approved',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  dataId: string;

  @ApiProperty({
    description: 'Name of the entity being approved',
    example: 'RiskAssessment',
  })
  @IsString()
  @IsNotEmpty()
  entity: string;

  @ApiProperty({
    description: 'Approval status',
    enum: ApprovalStatus,
    example: ApprovalStatus.APPROVED,
  })
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  status: ApprovalStatus;

  @ApiProperty({
    description: 'Notes or comments for the approval',
    example: 'All requirements have been met',
  })
  @IsString()
  @IsNotEmpty()
  notes: string;
} 