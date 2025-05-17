import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty()
  createdBy: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  status: string;

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
  @ApiProperty({ type: [CreateRiskAssessmentItemDto] })
  items: CreateRiskAssessmentItemDto[];
}