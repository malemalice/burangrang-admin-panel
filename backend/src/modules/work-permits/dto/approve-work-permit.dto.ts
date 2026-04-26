import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { WorkPermitClassificationSafetyGuidanceInputDto } from './work-permit-classification-safety-guidance.dto';
import { WorkPermitRequiredCourseDto } from './create-work-permit.dto';

export class ApproveWorkPermitDto {
  @ApiProperty({ description: 'Approval notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description:
      'HSE only: set during IN_REVIEW_HSE when approving — require the applicant to complete required courses (LMS) before SK sign',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requireCourseVerification?: boolean;

  @ApiProperty({
    description:
      'HSE only: set during IN_REVIEW_HSE when approving — replaces required courses for this permit',
    type: [WorkPermitRequiredCourseDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitRequiredCourseDto)
  requiredCourses?: WorkPermitRequiredCourseDto[];

  @ApiProperty({
    description: 'HSE-authored safety guidance per permit classification before applicant acknowledgment',
    type: [WorkPermitClassificationSafetyGuidanceInputDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitClassificationSafetyGuidanceInputDto)
  classificationSafetyGuidance?: WorkPermitClassificationSafetyGuidanceInputDto[];
}
