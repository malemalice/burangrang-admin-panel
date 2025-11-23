import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

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
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'] 
  })
  @Expose()
  @IsEnum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'])
  status: string;

  @ApiProperty({ description: 'Enrollment date' })
  @Expose()
  @IsDateString()
  enrolledAt: Date;

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

  @ApiProperty({ description: 'Last accessed date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  lastAccessedAt?: Date;

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
  }
}
