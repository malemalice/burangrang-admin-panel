import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FindChaptersOptions {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ description: 'Sort field', required: false, default: 'order' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'order';

  @ApiProperty({ 
    description: 'Sort order', 
    required: false, 
    enum: ['asc', 'desc'], 
    default: 'asc' 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Filter by published status', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ description: 'Filter by free status', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isFree?: boolean;

  @ApiProperty({ 
    description: 'Filter by content type', 
    required: false,
    enum: ['video', 'pdf', 'text', 'youtube']
  })
  @IsOptional()
  @IsEnum(['video', 'pdf', 'text', 'youtube'])
  contentType?: string;

  @ApiProperty({ description: 'Filter by course ID', required: false })
  @IsOptional()
  @IsString()
  courseId?: string;
}
