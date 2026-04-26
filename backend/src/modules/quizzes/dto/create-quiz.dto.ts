import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsInt, IsBoolean, IsEnum, IsArray, IsNumber, Min, Max, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizQuestionOptionDto {
  @ApiProperty({ description: 'Option text' })
  @IsString()
  @IsNotEmpty()
  optionText: string;

  @ApiProperty({ description: 'Whether this option is correct' })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ description: 'Option order' })
  @IsInt()
  @Min(0)
  order: number;
}

export class CreateQuizQuestionDto {
  @ApiProperty({ description: 'Question type', enum: ['MULTIPLE_CHOICE', 'ESSAY', 'TRUE_FALSE'] })
  @IsEnum(['MULTIPLE_CHOICE', 'ESSAY', 'TRUE_FALSE'])
  @IsNotEmpty()
  questionType: string;

  @ApiProperty({ description: 'Question text' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ description: 'Question explanation', required: false })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ description: 'Media URL', required: false })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiProperty({ description: 'Media type (image, video, audio)', required: false })
  @IsOptional()
  @IsString()
  mediaType?: string;

  @ApiProperty({ description: 'Points for this question', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number = 1;

  @ApiProperty({ description: 'Question order' })
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({ description: 'Question options (required for MULTIPLE_CHOICE and TRUE_FALSE)', required: false, type: [CreateQuizQuestionOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionOptionDto)
  @ValidateIf((o) => o.questionType === 'MULTIPLE_CHOICE' || o.questionType === 'TRUE_FALSE')
  @IsNotEmpty()
  options?: CreateQuizQuestionOptionDto[];
}

export class CreateQuizDto {
  @ApiProperty({ required: false, enum: ['LMS_QUIZ', 'HEALTH_DECLARATION'], description: 'Defaults to LMS_QUIZ' })
  @IsOptional()
  @IsEnum(['LMS_QUIZ', 'HEALTH_DECLARATION'])
  kind?: 'LMS_QUIZ' | 'HEALTH_DECLARATION';

  @ApiProperty({ description: 'Quiz title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Quiz description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Quiz instructions', required: false })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ description: 'Entity type (COURSE, CHAPTER, or null for standalone)', enum: ['COURSE', 'CHAPTER'], required: false })
  @IsOptional()
  @IsEnum(['COURSE', 'CHAPTER'])
  entity?: string;

  @ApiProperty({ description: 'Entity ID (courseId or chapterId). Required if entity is set.', required: false })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.entity !== null && o.entity !== undefined)
  @IsNotEmpty()
  entityId?: string;

  @ApiProperty({ description: 'Quiz duration in minutes', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiProperty({ description: 'Passing score percentage', default: 75, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore?: number = 75;

  @ApiProperty({ description: 'Maximum attempts allowed (null = unlimited)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiProperty({ description: 'Whether to shuffle questions', default: false })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean = false;

  @ApiProperty({ description: 'Whether to shuffle options', default: false })
  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean = false;

  @ApiProperty({ description: 'Whether to show correct answers after submission', default: true })
  @IsOptional()
  @IsBoolean()
  showCorrectAnswer?: boolean = true;

  @ApiProperty({ description: 'Whether to publish quiz immediately', default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = false;

  @ApiProperty({
    required: false,
    description:
      'If true, set as the global default health screening template (HEALTH_DECLARATION only; published, active, standalone)',
  })
  @IsOptional()
  @IsBoolean()
  isDefaultForHealthScreening?: boolean;

  @ApiProperty({ description: 'Quiz questions', type: [CreateQuizQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions: CreateQuizQuestionDto[];
}
