import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsArray } from 'class-validator';

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

  @ApiProperty({ description: 'Instructor ID', required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiProperty({ description: 'Category IDs to assign to the course', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}
