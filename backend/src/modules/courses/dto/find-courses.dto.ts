import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FindCoursesOptions {
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

  @ApiProperty({ description: 'Sort field', required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    required: false,
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Filter by instructor ID', required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiProperty({ description: 'Filter by category ID', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

}
