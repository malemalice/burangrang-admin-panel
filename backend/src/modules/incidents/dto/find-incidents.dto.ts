import { IsOptional, IsUUID, IsEnum, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  GeneralStatusEnum,
  IncidentTypeEnum,
  IncidentClassificationEnum,
  IncidentActivitiesEnum,
  IncidentScopeEnum,
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
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  @ApiProperty({ required: false, description: 'Filter by active status' })
  isActive?: boolean;

  @IsOptional()
  @IsUUID(undefined, { each: true })
  @ApiProperty({ required: false, description: 'Filter by area ID (supports multiple values)', isArray: true })
  areaId?: string | string[];

  @IsOptional()
  @IsUUID(undefined, { each: true })
  @ApiProperty({ required: false, description: 'Filter by risk category ID (supports multiple values)', isArray: true })
  riskCategoryId?: string | string[];

  @IsOptional()
  @IsEnum(GeneralStatusEnum, { each: true })
  @ApiProperty({ required: false, enum: GeneralStatusEnum, isArray: true, description: 'Filter by status (supports multiple values)' })
  status?: GeneralStatusEnum | GeneralStatusEnum[];

  @IsOptional()
  @IsEnum(IncidentTypeEnum, { each: true })
  @ApiProperty({ required: false, enum: IncidentTypeEnum, isArray: true, description: 'Filter by incident type (supports multiple values)' })
  incidentType?: IncidentTypeEnum | IncidentTypeEnum[];

  @IsOptional()
  @IsEnum(IncidentClassificationEnum)
  @ApiProperty({
    required: false,
    enum: IncidentClassificationEnum,
    description: 'Filter by incident classification',
  })
  incidentClassification?: IncidentClassificationEnum;

  @IsOptional()
  @IsEnum(IncidentActivitiesEnum, { each: true })
  @ApiProperty({ required: false, enum: IncidentActivitiesEnum, isArray: true, description: 'Filter by activities (supports multiple values)' })
  activities?: IncidentActivitiesEnum | IncidentActivitiesEnum[];

  @IsOptional()
  @IsEnum(IncidentScopeEnum, { each: true })
  @ApiProperty({ required: false, enum: IncidentScopeEnum, isArray: true, description: 'Filter by type general/security (supports multiple values)' })
  type?: IncidentScopeEnum | IncidentScopeEnum[];

  @IsOptional()
  @IsEnum(PriorityEnum, { each: true })
  @ApiProperty({ required: false, enum: PriorityEnum, isArray: true, description: 'Filter by priority (supports multiple values)' })
  priority?: PriorityEnum | PriorityEnum[];

  @IsOptional()
  @IsEnum(SourceEnum)
  @ApiProperty({ required: false, enum: SourceEnum, description: 'Filter by source' })
  source?: SourceEnum;

  @IsOptional()
  @IsUUID(undefined, { each: true })
  @ApiProperty({ required: false, description: 'Filter by assigned department ID (supports multiple values)', isArray: true })
  assignedDepartmentId?: string | string[];

  @IsOptional()
  @IsUUID(undefined, { each: true })
  @ApiProperty({ required: false, description: 'Filter by assignee ID (supports multiple values)', isArray: true })
  assigneeId?: string | string[];

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Search term for code, subject, or description' })
  search?: string;
}
