import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  WorkClassificationAttachmentInputDto,
} from './work-classification-attachment.dto';
import { WorkClassificationRiskEquipmentInputDto } from './work-classification-risk-equipment.dto';

export class CreateWorkClassificationDto {
  @ApiProperty({ description: 'Classification name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Classification code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Safety guideline text' })
  @IsString()
  @IsOptional()
  safetyGuideline?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Attached documents',
    type: [WorkClassificationAttachmentInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkClassificationAttachmentInputDto)
  attachments?: WorkClassificationAttachmentInputDto[];

  @ApiPropertyOptional({
    description: 'Risk + safety equipment bound rows',
    type: [WorkClassificationRiskEquipmentInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkClassificationRiskEquipmentInputDto)
  riskEquipmentRows?: WorkClassificationRiskEquipmentInputDto[];
}
