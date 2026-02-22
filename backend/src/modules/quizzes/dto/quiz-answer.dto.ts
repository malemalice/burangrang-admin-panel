import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString, IsNotEmpty, Min } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class QuizAnswerDto {
  @ApiProperty({ description: 'Answer unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Attempt ID' })
  @Expose()
  @IsString()
  attemptId: string;

  @ApiProperty({ description: 'Question ID' })
  @Expose()
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'Selected option ID (for multiple choice/true-false)', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @ApiProperty({ description: 'Essay answer text', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  essayAnswer?: string;

  @ApiProperty({ description: 'Whether answer is correct (null for ungraded essays)', required: false })
  @Expose()
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiProperty({ description: 'Points earned', type: 'number', format: 'decimal' })
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  pointsEarned: number;

  @ApiProperty({ description: 'Feedback from grader', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiProperty({ description: 'Grader user ID', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  gradedBy?: string;

  @ApiProperty({ description: 'Grading date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  gradedAt?: Date;

  @ApiProperty({ description: 'Question details', required: false })
  @Expose()
  @IsOptional()
  question?: any;

  @ApiProperty({ description: 'Selected option details', required: false })
  @Expose()
  @IsOptional()
  selectedOption?: any;

  constructor(partial: Partial<QuizAnswerDto>) {
    Object.assign(this, partial);
  }
}

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'Selected option ID (for multiple choice/true-false)', required: false })
  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @ApiProperty({ description: 'Essay answer text (for essay questions)', required: false })
  @IsOptional()
  @IsString()
  essayAnswer?: string;
}

export class GradeAnswerDto {
  @ApiProperty({ description: 'Points to award', minimum: 0 })
  @IsNumber()
  @Min(0)
  pointsEarned: number;

  @ApiProperty({ description: 'Whether answer is correct' })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ description: 'Feedback for the student', required: false })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class GradeEssayByQuestionDto {
  @ApiProperty({ description: 'Question ID (essay question to grade)' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'Points to award', minimum: 0 })
  @IsNumber()
  @Min(0)
  pointsEarned: number;

  @ApiProperty({ description: 'Whether answer is correct' })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ description: 'Feedback for the student', required: false })
  @IsOptional()
  @IsString()
  feedback?: string;
}
