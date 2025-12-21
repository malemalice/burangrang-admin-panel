import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExtendWorkPermitDto {
  @ApiProperty({ description: 'New proposed end date (ISO 8601 format)' })
  @IsDateString()
  @IsNotEmpty()
  newEndDate: string;

  @ApiProperty({ description: 'Extension reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
