import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class QuizAttemptDto {
  @ApiProperty({ description: 'Attempt unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Quiz ID' })
  @Expose()
  @IsString()
  quizId: string;

  @ApiProperty({ description: 'Enrollment ID (for bound quizzes)', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  enrollmentId?: string;

  @ApiProperty({ description: 'User ID (for standalone quizzes)', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Attempt number' })
  @Expose()
  @IsInt()
  attemptNumber: number;

  @ApiProperty({ description: 'Attempt status', enum: ['INVITING', 'INVITED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'] })
  @Expose()
  @IsEnum(['INVITING', 'INVITED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'])
  status: string;

  @ApiProperty({ description: 'Score percentage', type: 'number', format: 'decimal', required: false })
  @Expose()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  score?: number;

  @ApiProperty({ description: 'Total points possible', type: 'number', format: 'decimal', required: false })
  @Expose()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  totalPoints?: number;

  @ApiProperty({ description: 'Points earned', type: 'number', format: 'decimal', required: false })
  @Expose()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  earnedPoints?: number;

  @ApiProperty({ description: 'Whether attempt passed' })
  @Expose()
  @IsBoolean()
  isPassed: boolean;

  @ApiProperty({ description: 'Due date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({ description: 'Start time' })
  @Expose()
  @IsDateString()
  startedAt: Date;

  @ApiProperty({ description: 'Completion time', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  completedAt?: Date;

  @ApiProperty({ description: 'Time spent in seconds' })
  @Expose()
  @IsInt()
  timeSpent: number;

  @ApiProperty({ description: 'Quiz details', required: false })
  @Expose()
  @IsOptional()
  quiz?: any;

  @ApiProperty({ description: 'Answers', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  answers?: any[];

  constructor(partial: Partial<QuizAttemptDto>) {
    Object.assign(this, partial);
  }
}

export class CreateQuizAttemptDto {
  @ApiProperty({ description: 'Enrollment ID (for bound quizzes)', required: false })
  @IsOptional()
  @IsString()
  enrollmentId?: string;
}
