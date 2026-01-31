import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Expose } from 'class-transformer';

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class ProgressDto {
  @ApiProperty({ description: 'Progress ID' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Enrollment ID' })
  @Expose()
  @IsString()
  enrollmentId: string;

  @ApiProperty({ description: 'Chapter ID' })
  @Expose()
  @IsString()
  chapterId: string;

  @ApiProperty({ description: 'Progress status', enum: ProgressStatus })
  @Expose()
  @IsEnum(ProgressStatus)
  status: string;

  @ApiProperty({ description: 'Time spent in seconds' })
  @Expose()
  @IsNumber()
  timeSpent: number;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  @Expose()
  @IsNumber()
  progress: number;

  @ApiProperty({ description: 'Started at date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  startedAt?: Date;

  @ApiProperty({ description: 'Completed at date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  completedAt?: Date;

  @ApiProperty({ description: 'Last accessed date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  lastAccessedAt?: Date;
}
