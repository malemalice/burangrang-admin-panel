import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveWorkPermitDto {
  @ApiProperty({ description: 'Approval notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Safety guideline (SK) authored by HSE before applicant acknowledgment',
    required: false,
  })
  @IsOptional()
  @IsString()
  safetyGuideline?: string;
}
