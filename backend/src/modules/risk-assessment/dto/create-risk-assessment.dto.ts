import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralStatusEnum } from '@prisma/client';
import { CreateRiskAssessmentItemDto } from './create-risk-assessment-item.dto';

export class CreateRiskAssessmentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  code: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  departmentId: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({ required: false })
  assessmentDate?: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Will be set automatically from authenticated user' })
  createdBy?: string;

  @IsNotEmpty()
  @IsEnum(GeneralStatusEnum)
  @ApiProperty({ enum: GeneralStatusEnum })
  status: GeneralStatusEnum;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  assigneeId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  actionPlan?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRiskAssessmentItemDto)
  @IsOptional()
  @ApiProperty({ type: [CreateRiskAssessmentItemDto], required: false })
  items?: CreateRiskAssessmentItemDto[];
}