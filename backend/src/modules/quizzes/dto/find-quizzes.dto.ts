import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindQuizzesOptions {
  @ApiProperty({ description: 'Page number', required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Sort field', required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'], required: false, default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @Transform(({ value, key, obj }) => {
    // Get raw value from query object before any conversion
    const rawValue = obj[key];

    // Handle string values from query parameters
    if (typeof rawValue === 'string') {
      if (rawValue.toLowerCase() === 'true') return true;
      if (rawValue.toLowerCase() === 'false') return false;
    }

    // Handle boolean values (already converted)
    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    // Handle string value parameter
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;

    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Filter by published status', required: false })
  @IsOptional()
  @Transform(({ value, key, obj }) => {
    // Get raw value from query object before any conversion
    const rawValue = obj[key];

    // Handle string values from query parameters
    if (typeof rawValue === 'string') {
      if (rawValue.toLowerCase() === 'true') return true;
      if (rawValue.toLowerCase() === 'false') return false;
    }

    // Handle boolean values (already converted)
    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    // Handle string value parameter
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;

    return value;
  })
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ description: 'Filter by entity type', enum: ['COURSE', 'CHAPTER', 'STANDALONE'], required: false })
  @IsOptional()
  @IsEnum(['COURSE', 'CHAPTER', 'STANDALONE'])
  entity?: string;

  @ApiProperty({ description: 'Filter by entity ID', required: false })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Filter by creator ID', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
