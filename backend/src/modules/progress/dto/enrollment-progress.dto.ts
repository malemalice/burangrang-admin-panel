import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsArray } from 'class-validator';
import { Expose } from 'class-transformer';

export class ChapterProgressSummary {
  @ApiProperty({ description: 'Chapter unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Chapter title' })
  @Expose()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Chapter order' })
  @Expose()
  @IsInt()
  order: number;

  @ApiProperty({ description: 'Chapter duration in minutes' })
  @Expose()
  @IsInt()
  duration: number;

  @ApiProperty({ description: 'Content type' })
  @Expose()
  @IsString()
  contentType: string;

  @ApiProperty({ description: 'Content URL', required: false })
  @Expose()
  contentUrl?: string;

  @ApiProperty({ description: 'YouTube video ID', required: false })
  @Expose()
  youtubeVideoId?: string;

  @ApiProperty({ description: 'Chapter completion status', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] })
  @Expose()
  @IsString()
  status: string;

  @ApiProperty({ description: 'Whether chapter is completed' })
  @Expose()
  isCompleted: boolean;

  @ApiProperty({ description: 'Chapter completed date', required: false })
  @Expose()
  completedAt?: Date;

  constructor(partial: Partial<ChapterProgressSummary>) {
    Object.assign(this, partial);
  }
}

export class EnrollmentProgressDto {
  @ApiProperty({ description: 'Enrollment unique identifier' })
  @Expose()
  @IsString()
  enrollmentId: string;

  @ApiProperty({ description: 'Course unique identifier' })
  @Expose()
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'Course title' })
  @Expose()
  @IsString()
  courseTitle: string;

  @ApiProperty({ description: 'Overall progress percentage (0-100)' })
  @Expose()
  progress: number;

  @ApiProperty({ description: 'Number of completed chapters' })
  @Expose()
  @IsInt()
  completedChapters: number;

  @ApiProperty({ description: 'Total number of chapters' })
  @Expose()
  @IsInt()
  totalChapters: number;

  @ApiProperty({ description: 'Last accessed date', required: false })
  @Expose()
  lastAccessedAt?: Date;

  @ApiProperty({ description: 'Enrollment completion date', required: false })
  @Expose()
  completedAt?: Date;

  @ApiProperty({ description: 'Current chapter ID (next uncompleted chapter)', required: false })
  @Expose()
  currentChapterId?: string;

  @ApiProperty({ description: 'List of chapters with progress', type: [ChapterProgressSummary] })
  @Expose()
  @IsArray()
  chapters: ChapterProgressSummary[];

  constructor(partial: Partial<EnrollmentProgressDto>) {
    Object.assign(this, partial);
    
    // Convert Decimal to number for API response
    if (partial.progress !== undefined && typeof partial.progress !== 'number') {
      this.progress = Number(partial.progress);
    }
  }
}

