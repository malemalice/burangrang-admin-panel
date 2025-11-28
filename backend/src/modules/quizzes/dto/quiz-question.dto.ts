import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsArray, IsNumber } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class QuizQuestionOptionDto {
  @ApiProperty({ description: 'Option unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Option text' })
  @Expose()
  @IsString()
  optionText: string;

  @ApiProperty({ description: 'Whether this option is correct' })
  @Expose()
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ description: 'Option order' })
  @Expose()
  @IsInt()
  order: number;

  constructor(partial: Partial<QuizQuestionOptionDto>) {
    Object.assign(this, partial);
  }
}

export class QuizQuestionDto {
  @ApiProperty({ description: 'Question unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Question type', enum: ['MULTIPLE_CHOICE', 'ESSAY', 'TRUE_FALSE'] })
  @Expose()
  @IsEnum(['MULTIPLE_CHOICE', 'ESSAY', 'TRUE_FALSE'])
  questionType: string;

  @ApiProperty({ description: 'Question text' })
  @Expose()
  @IsString()
  questionText: string;

  @ApiProperty({ description: 'Question explanation', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ description: 'Media URL', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiProperty({ description: 'Media type (image, video, audio)', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  mediaType?: string;

  @ApiProperty({ description: 'Points for this question', type: 'number', format: 'decimal' })
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 1;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  points: number;

  @ApiProperty({ description: 'Question order' })
  @Expose()
  @IsInt()
  order: number;

  @ApiProperty({ description: 'Whether question is active' })
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Question options (for MULTIPLE_CHOICE and TRUE_FALSE)', required: false, type: [QuizQuestionOptionDto] })
  @Expose()
  @IsOptional()
  @IsArray()
  options?: QuizQuestionOptionDto[];

  constructor(partial: Partial<QuizQuestionDto>) {
    Object.assign(this, partial);
  }
}
