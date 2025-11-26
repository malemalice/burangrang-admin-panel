import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsBoolean } from 'class-validator';

export class EnrollmentDto {
  @ApiProperty({ description: 'Enrollment unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'User ID who is enrolled' })
  @Expose()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Course ID' })
  @Expose()
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'Order ID if enrolled via purchase', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({
    description: 'Enrollment status',
    enum: ['INVITED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED']
  })
  @Expose()
  @IsEnum(['INVITED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'])
  status: string;

  @ApiProperty({ description: 'Enrollment date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  enrolledAt?: Date;

  @ApiProperty({ description: 'Completion date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  completedAt?: Date;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    // Handle Prisma Decimal type
    if (typeof value === 'object' && 'toString' in value) {
      return Number(value.toString());
    }
    return Number(value);
  })
  @IsNumber()
  progress: number;

  @ApiProperty({ description: 'Score percentage (0-100)', required: false })
  @Expose()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && 'toString' in value) {
      return Number(value.toString());
    }
    return Number(value);
  })
  @IsNumber()
  score?: number;

  @ApiProperty({ description: 'Last accessed date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  lastAccessedAt?: Date;

  // Assignment fields
  @ApiProperty({ description: 'User ID who assigned this enrollment', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  assignedBy?: string;

  @ApiProperty({ description: 'Date when course was assigned', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  assignedAt?: Date;

  @ApiProperty({ description: 'Due date for course completion', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({ description: 'Whether enrollment is required', required: false })
  @Expose()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({ description: 'Assignment notes or instructions', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  notes?: string;

  // Relations
  @ApiProperty({ description: 'User who assigned this enrollment', required: false })
  @Expose()
  @IsOptional()
  assigner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty({ description: 'Enrolled user information', required: false })
  @Expose()
  @IsOptional()
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty({ description: 'Course information', required: false })
  @Expose()
  @IsOptional()
  course?: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string;
  };

  @ApiProperty({ description: 'Creation date' })
  @Expose()
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @Expose()
  @IsDateString()
  updatedAt: Date;

  constructor(partial: Partial<EnrollmentDto>) {
    Object.assign(this, partial);

    // Convert Decimal to number for API response
    if (partial.progress !== undefined && typeof partial.progress !== 'number') {
      this.progress = Number(partial.progress);
    }
    if (partial.score !== undefined && partial.score !== null && typeof partial.score !== 'number') {
      this.score = Number(partial.score);
    }
  }
}
