import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEnum, IsDateString } from 'class-validator';
import { Expose } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class ProgressDto {
  @ApiProperty({ description: 'Progress record unique identifier' })
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

  @ApiProperty({ 
    description: 'Progress status', 
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] 
  })
  @Expose()
  @IsEnum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
  status: string;

  @ApiProperty({ description: 'Time spent on chapter in seconds' })
  @Expose()
  @IsInt()
  timeSpent: number;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  @Expose()
  progress: number;

  @ApiProperty({ description: 'Chapter started date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  startedAt?: Date;

  @ApiProperty({ description: 'Chapter completed date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  completedAt?: Date;

  @ApiProperty({ description: 'Last accessed date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  lastAccessedAt?: Date;

  @ApiProperty({ description: 'Progress record creation date' })
  @Expose()
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ description: 'Progress record last update date' })
  @Expose()
  @IsDateString()
  updatedAt: Date;

  // Relations (optional, included when requested)
  @ApiProperty({ description: 'Chapter information', required: false })
  @Expose()
  @IsOptional()
  chapter?: {
    id: string;
    title: string;
    order: number;
    duration: number;
    contentType: string;
    contentUrl?: string;
    youtubeVideoId?: string;
  };

  @ApiProperty({ description: 'Enrollment information', required: false })
  @Expose()
  @IsOptional()
  enrollment?: {
    id: string;
    userId: string;
    courseId: string;
    progress: number;
  };

  constructor(partial: Partial<ProgressDto>) {
    Object.assign(this, partial);
    
    // Convert Decimal to number for API response
    if (partial.progress !== undefined && typeof partial.progress !== 'number') {
      this.progress = Number(partial.progress);
    }
  }
}

