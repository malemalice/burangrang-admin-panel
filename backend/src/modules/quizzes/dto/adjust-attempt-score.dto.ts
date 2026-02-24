import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsBoolean, IsString, Min, Max } from 'class-validator';

export class AdjustAttemptScoreDto {
  @ApiProperty({ description: 'Adjusted score (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  adjustedScore: number;

  @ApiProperty({ description: 'Reason for adjustment', required: false })
  @IsOptional()
  @IsString()
  adjustmentReason?: string;

  @ApiProperty({ description: 'Override pass/fail status', required: false })
  @IsOptional()
  @IsBoolean()
  overridePassStatus?: boolean;
}
