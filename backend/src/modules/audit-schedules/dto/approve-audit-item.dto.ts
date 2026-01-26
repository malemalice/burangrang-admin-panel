import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveAuditItemDto {
  @ApiProperty({
    description: 'Optional notes for the approval',
    example: 'Approved after reviewing the corrective actions',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}