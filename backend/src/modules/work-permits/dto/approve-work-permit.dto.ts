import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveWorkPermitDto {
  @ApiProperty({ description: 'Approval notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
