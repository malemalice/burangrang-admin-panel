import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDecimal, IsInt, IsBoolean, IsUUID, IsArray, IsDateString } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class CourseDto {
  @ApiProperty({ description: 'Course unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Course title' })
  @Expose()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Course slug for URLs' })
  @Expose()
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Course description', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Short course description', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ description: 'Course thumbnail URL', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Total number of chapters' })
  @Expose()
  @IsInt()
  totalChapters: number;

  @ApiProperty({ description: 'Total duration in minutes' })
  @Expose()
  @IsInt()
  totalDuration: number;

  @ApiProperty({ description: 'Course difficulty level', enum: ['beginner', 'intermediate', 'advanced'] })
  @Expose()
  @IsString()
  difficulty: string;

  @ApiProperty({ description: 'Course language' })
  @Expose()
  @IsString()
  language: string;

  @ApiProperty({ description: 'Course rating', type: 'number', format: 'decimal' })
  @Expose()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value instanceof Decimal) return Number(value.toString());
    return Number(value);
  })
  rating: number;

  @ApiProperty({ description: 'Number of reviews' })
  @Expose()
  @IsInt()
  reviewCount: number;

  @ApiProperty({ description: 'Number of enrolled students' })
  @Expose()
  @IsInt()
  studentCount: number;

  @ApiProperty({ description: 'Instructor ID' })
  @Expose()
  @IsString()
  instructorId: string;

  @ApiProperty({ description: 'Course status', enum: ['draft', 'review', 'published', 'archived'] })
  @Expose()
  @IsString()
  status: string;

  @ApiProperty({ description: 'Whether course is published' })
  @Expose()
  @IsBoolean()
  isPublished: boolean;

  @ApiProperty({ description: 'Course published date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  publishedAt?: Date;

  @ApiProperty({ description: 'Associated product for pricing', required: false })
  @Expose()
  @IsOptional()
  product?: {
    id: string;
    name: string;
    price: number;
    salePrice?: number;
  };

  @ApiProperty({ description: 'Whether course is active' })
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Course creation date' })
  @Expose()
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ description: 'Course last update date' })
  @Expose()
  @IsDateString()
  updatedAt: Date;

  // Relations (optional, included when requested)
  @ApiProperty({ description: 'Course instructor', required: false })
  @Expose()
  @IsOptional()
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty({ description: 'Course categories', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  categories?: {
    id: string;
    name: string;
    slug: string;
  }[];

  @ApiProperty({ description: 'Course chapters', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  chapters?: {
    id: string;
    title: string;
    order: number;
    duration: number;
    isPublished: boolean;
  }[];

  constructor(partial: Partial<CourseDto>) {
    Object.assign(this, partial);
  }
}
