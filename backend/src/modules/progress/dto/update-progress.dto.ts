import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ProgressStatus } from './progress.dto';

export class UpdateProgressDto {
  @ApiProperty({ description: 'Progress status', enum: ProgressStatus, required: false })
  @IsOptional()
  @IsEnum(ProgressStatus)
  status?: string;

  @ApiProperty({ description: 'Time spent in seconds', required: false })
  @IsOptional()
  @IsNumber()
  timeSpent?: number;

  @ApiProperty({ description: 'Progress percentage (0-100)', required: false })
  @IsOptional()
  @IsNumber()
  progress?: number;
}
