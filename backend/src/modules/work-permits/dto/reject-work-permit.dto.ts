import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RejectWorkPermitDto {
  @ApiProperty({ description: 'Rejection reason (required)' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
