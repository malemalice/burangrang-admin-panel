import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { WorkPermitClassificationSafetyGuidanceInputDto } from './work-permit-classification-safety-guidance.dto';

export class ApproveWorkPermitDto {
  @ApiProperty({ description: 'Approval notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

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
