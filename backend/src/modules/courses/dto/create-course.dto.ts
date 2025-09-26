import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsDecimal, IsArray, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({ description: 'Course title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Course slug for URLs (auto-generated if not provided)', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Course description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Short course description', required: false })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ description: 'Course thumbnail URL', required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ 
    description: 'Course difficulty level', 
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  @IsOptional()
  difficulty?: string = 'beginner';

  @ApiProperty({ description: 'Course language', default: 'en' })
  @IsString()
  @IsOptional()
  language?: string = 'en';

  @ApiProperty({ description: 'Instructor ID' })
  @IsString()
  @IsNotEmpty()
  instructorId: string;

  @ApiProperty({ 
    description: 'Course status', 
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft'
  })
  @IsEnum(['draft', 'review', 'published', 'archived'])
  @IsOptional()
  status?: string = 'draft';

  @ApiProperty({ description: 'Course price', type: 'number', format: 'decimal', required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiProperty({ description: 'Course sale price', type: 'number', format: 'decimal', required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  salePrice?: number;

  @ApiProperty({ description: 'Category IDs to assign to the course', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}
