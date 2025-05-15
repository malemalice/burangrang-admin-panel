import { IsString, IsUUID, IsOptional, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateRiskAssessmentItemDto } from './create-risk-assessment-item.dto';

export class CreateRiskAssessmentDto {
  @IsString()
  @ApiProperty()
  code: string;

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

  @IsString()
  @ApiProperty()
  status: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRiskAssessmentItemDto)
  @ApiProperty({ type: [CreateRiskAssessmentItemDto] })
  items: CreateRiskAssessmentItemDto[];
} 