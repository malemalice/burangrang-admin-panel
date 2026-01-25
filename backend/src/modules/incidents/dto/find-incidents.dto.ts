import { IsOptional, IsUUID, IsEnum, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  GeneralStatusEnum,
  IncidentTypeEnum,
  IncidentClassificationEnum,
  PriorityEnum,
  SourceEnum,
} from '@prisma/client';

export class FindIncidentsDto {
  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ required: false, description: 'Page number (1-based)' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ required: false, description: 'Number of items per page' })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Field to sort by' })
  sortBy?: string;

  @IsOptional()
  @ApiProperty({ required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @ApiProperty({ required: false, description: 'Filter by active status' })
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false, description: 'Filter by area ID' })
  areaId?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false, description: 'Filter by risk category ID' })
  riskCategoryId?: string;

  @IsOptional()
  @IsEnum(GeneralStatusEnum)
  @ApiProperty({ required: false, enum: GeneralStatusEnum, description: 'Filter by status' })
  status?: GeneralStatusEnum;

  @IsOptional()
  @IsEnum(IncidentTypeEnum)
  @ApiProperty({ required: false, enum: IncidentTypeEnum, description: 'Filter by incident type' })
  incidentType?: IncidentTypeEnum;

  @IsOptional()
  @IsEnum(IncidentClassificationEnum)
  @ApiProperty({
    required: false,
    enum: IncidentClassificationEnum,
    description: 'Filter by incident classification',
  })
  incidentClassification?: IncidentClassificationEnum;

  @IsOptional()
  @IsEnum(PriorityEnum)
  @ApiProperty({ required: false, enum: PriorityEnum, description: 'Filter by priority' })
  priority?: PriorityEnum;

  @IsOptional()
  @IsEnum(SourceEnum)
  @ApiProperty({ required: false, enum: SourceEnum, description: 'Filter by source' })
  source?: SourceEnum;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false, description: 'Filter by assigned department ID' })
  assignedDepartmentId?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false, description: 'Filter by assignee ID' })
  assigneeId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Search term for code, subject, or description' })
  search?: string;
}
