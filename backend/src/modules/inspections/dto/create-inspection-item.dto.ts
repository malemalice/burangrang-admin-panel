import {
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GeneralStatusEnum } from '@prisma/client';
import { CreateInspectionImageDto } from './create-inspection-image.dto';
import { RiskMitigationDataDto } from '../../risk-assessment/dto/risk-mitigation-data.dto';
import { CreateInspectionChecklistResultDto } from './inspection-checklist-result.dto';

export class CreateInspectionItemDto {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  areaId: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ description: 'Type of hazard ID' })
  riskCategoryId: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  riskId: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  assignedDepartmentId: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  assigneeId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  followUpNotes?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Findings from the inspection' })
  findings?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false, description: 'Due date for the inspection item' })
  dueDateAt?: string;

  @IsNotEmpty()
  @IsEnum(GeneralStatusEnum)
  @ApiProperty({ enum: GeneralStatusEnum })
  status: GeneralStatusEnum;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInspectionImageDto)
  @ApiProperty({ type: [CreateInspectionImageDto], required: false })
  images?: CreateInspectionImageDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RiskMitigationDataDto)
  @ApiProperty({ type: RiskMitigationDataDto, required: false, description: 'Risk mitigation record' })
  mitigation?: RiskMitigationDataDto;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false, description: 'Checklist template ID (depth-0 root node)' })
  checklistId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInspectionChecklistResultDto)
  @ApiProperty({ type: [CreateInspectionChecklistResultDto], required: false, description: 'Checklist results for leaf items' })
  checklistResults?: CreateInspectionChecklistResultDto[];
}

