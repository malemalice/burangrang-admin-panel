import { IsString, IsUUID, IsOptional, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAssessmentItemDto } from './create-assessment-item.dto';

export class CreateAssessmentDto {
  @IsString()
  @ApiProperty()
  code: string;

  @IsUUID()
  @ApiProperty()
  departmentId: string;

  @IsDate()
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
  @Type(() => CreateAssessmentItemDto)
  @ApiProperty({ type: [CreateAssessmentItemDto] })
  items: CreateAssessmentItemDto[];
} 