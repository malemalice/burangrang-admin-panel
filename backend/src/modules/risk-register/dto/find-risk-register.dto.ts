import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { GeneralStatusEnum } from '@prisma/client';

export class FindRiskRegisterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    enum: ['RISK_ASSESSMENT_ITEM', 'INSPECTION_ITEM'],
  })
  @IsEnum(['RISK_ASSESSMENT_ITEM', 'INSPECTION_ITEM'])
  @IsOptional()
  entityType?: 'RISK_ASSESSMENT_ITEM' | 'INSPECTION_ITEM';

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by risk ID' })
  @IsUUID()
  @IsOptional()
  riskId?: string;

  @ApiPropertyOptional({ description: 'Filter by risk category ID' })
  @IsUUID()
  @IsOptional()
  riskCategoryId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status. Uses GeneralStatusEnum for both risk assessments and inspection items.', 
    enum: GeneralStatusEnum 
  })
  @IsEnum(GeneralStatusEnum)
  @IsOptional()
  status?: GeneralStatusEnum;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;
}
