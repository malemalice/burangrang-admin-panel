import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateAuditPeriodDto {
  @ApiProperty({ description: 'Month number (1–12)', example: 1 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Year (e.g. 2026)', example: 2026 })
  @IsInt()
  @Min(2020)
  @Max(2099)
  year: number;

  @ApiProperty({ required: false, description: 'Optional notes about this period' })
  @IsOptional()
  @IsString()
  notes?: string;
}
