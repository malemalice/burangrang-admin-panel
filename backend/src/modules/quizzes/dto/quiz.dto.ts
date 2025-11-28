import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsArray, IsDateString, IsNumber } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class QuizDto {
  @ApiProperty({ description: 'Quiz unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Quiz title' })
  @Expose()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Quiz description', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Quiz instructions', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ description: 'Entity type (COURSE, CHAPTER, or null for standalone)', enum: ['COURSE', 'CHAPTER'], required: false })
  @Expose()
  @IsOptional()
  @IsEnum(['COURSE', 'CHAPTER'])
  entity?: string;

  @ApiProperty({ description: 'Entity ID (courseId or chapterId)', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Quiz duration in minutes', required: false })
  @Expose()
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({ description: 'Passing score percentage', type: 'number', format: 'decimal' })
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 75;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  passingScore: number;

  @ApiProperty({ description: 'Maximum attempts allowed (null = unlimited)', required: false })
  @Expose()
  @IsOptional()
  @IsInt()
  maxAttempts?: number;

  @ApiProperty({ description: 'Whether to shuffle questions' })
  @Expose()
  @IsBoolean()
  shuffleQuestions: boolean;

  @ApiProperty({ description: 'Whether to shuffle options' })
  @Expose()
  @IsBoolean()
  shuffleOptions: boolean;

  @ApiProperty({ description: 'Whether to show correct answers after submission' })
  @Expose()
  @IsBoolean()
  showCorrectAnswer: boolean;

  @ApiProperty({ description: 'Whether quiz is published' })
  @Expose()
  @IsBoolean()
  isPublished: boolean;

  @ApiProperty({ description: 'Quiz published date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  publishedAt?: Date;

  @ApiProperty({ description: 'Whether quiz is active' })
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Creator user ID' })
  @Expose()
  @IsString()
  createdBy: string;

  @ApiProperty({ description: 'Quiz creation date' })
  @Expose()
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ description: 'Quiz last update date' })
  @Expose()
  @IsDateString()
  updatedAt: Date;

  // Relations (optional, included when requested)
  @ApiProperty({ description: 'Quiz creator', required: false })
  @Expose()
  @IsOptional()
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty({ description: 'Course (if entity is COURSE)', required: false })
  @Expose()
  @IsOptional()
  course?: {
    id: string;
    title: string;
    slug: string;
  };

  @ApiProperty({ description: 'Chapter (if entity is CHAPTER)', required: false })
  @Expose()
  @IsOptional()
  chapter?: {
    id: string;
    title: string;
    courseId: string;
  };

  @ApiProperty({ description: 'Quiz questions', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  questions?: any[];

  @ApiProperty({ description: 'Quiz statistics', required: false })
  @Expose()
  @IsOptional()
  statistics?: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    totalQuestions: number;
  };

  constructor(partial: Partial<QuizDto>) {
    Object.assign(this, partial);
  }
}
