import {
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  IsNotEmpty,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IssueStatus } from '@prisma/client';
import { CreateInspectionImageDto } from './create-inspection-image.dto';
import { RiskMitigationDataDto } from '../../risk-assessment/dto/risk-mitigation-data.dto';

export class CreateInspectionItemDto {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  areaId: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
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
  @IsEnum(IssueStatus)
  @ApiProperty({ enum: IssueStatus })
  status: IssueStatus;

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
}

