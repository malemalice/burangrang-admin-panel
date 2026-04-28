import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApprovalStatus } from '../../approvals/dto/submit-approval.dto';

export class SubmitApprovalDecisionDto {
  @ApiProperty({ enum: ApprovalStatus, description: 'Approval decision' })
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @ApiProperty({ description: 'Approval notes or rejection reason', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
