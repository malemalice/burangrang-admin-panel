import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class WorkPermitSafetyGuidanceRowInputDto {
  @ApiProperty({ description: 'Risk (hazard) master ID' })
  @IsString()
  @IsNotEmpty()
  riskId: string;

  @ApiProperty({ description: 'Safety equipment master ID' })
  @IsString()
  @IsNotEmpty()
  safetyEquipmentId: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Display order', default: 0 })
  @IsInt()
  @Min(0)
  order: number;
}

/** Create permit: match overlay to classification line before join IDs exist */
export class WorkPermitClassificationSafetyGuidanceOnCreateDto {
  @ApiProperty({ description: 'Work classification master ID' })
  @IsString()
  @IsNotEmpty()
  workClassificationId: string;

  @ApiProperty({ description: 'Same order as in classifications[]' })
  @IsInt()
  @Min(0)
  order: number;

  @ApiPropertyOptional({
    description: 'Override TipTap HTML (defaults from master if omitted)',
  })
  @IsOptional()
  @IsString()
  safetyGuidelineSnapshot?: string | null;

  @ApiProperty({ type: [WorkPermitSafetyGuidanceRowInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitSafetyGuidanceRowInputDto)
  rows: WorkPermitSafetyGuidanceRowInputDto[];
}

/** Payload to replace permit-owned guidance for one selected classification on the permit */
export class WorkPermitClassificationSafetyGuidanceInputDto {
  @ApiProperty({ description: 'Work permit classification join row ID' })
  @IsString()
  @IsNotEmpty()
  workPermitClassificationId: string;

  @ApiPropertyOptional({
    description: 'Copied TipTap HTML from master; editable on permit',
  })
  @IsOptional()
  @IsString()
  safetyGuidelineSnapshot?: string | null;

  @ApiProperty({ type: [WorkPermitSafetyGuidanceRowInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitSafetyGuidanceRowInputDto)
  rows: WorkPermitSafetyGuidanceRowInputDto[];
}

export class WorkPermitSafetyGuidanceRowItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  riskId: string;

  @ApiProperty()
  @Expose()
  safetyEquipmentId: string;

  @ApiPropertyOptional()
  @Expose()
  notes?: string | null;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiPropertyOptional()
  @Expose()
  riskNameSnapshot?: string | null;

  @ApiPropertyOptional()
  @Expose()
  safetyEquipmentNameSnapshot?: string | null;

  @ApiPropertyOptional()
  @Expose()
  risk?: { id: string; name: string; code: string };

  @ApiPropertyOptional()
  @Expose()
  safetyEquipment?: { id: string; name: string; code: string };
}
