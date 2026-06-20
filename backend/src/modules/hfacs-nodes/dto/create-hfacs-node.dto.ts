import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUUID,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { InvestigationCauseSectionEnum } from '@prisma/client';

export class CreateHfacsNodeDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Parent node ID. Null for Tier1 (depth 0); required for Tier2 and Items',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({
    enum: InvestigationCauseSectionEnum,
    description: 'LATENT_FAILURE (Section H) or ACTIVE_FAILURE (Section I)',
  })
  @IsEnum(InvestigationCauseSectionEnum)
  section: InvestigationCauseSectionEnum;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Stable code (e.g. "OC_001"). Typically set on leaf items (depth 2) only',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'English label' })
  @IsString()
  @IsNotEmpty()
  labelEn: string;

  @ApiProperty({ description: 'Indonesian label' })
  @IsString()
  @IsNotEmpty()
  labelId: string;

  @ApiProperty({
    required: false,
    default: false,
    description: 'True for "Others / Lain-lain" entries (exposes free-text input in the investigation form)',
  })
  @IsOptional()
  @IsBoolean()
  isOther?: boolean;

  @ApiProperty({ required: false, default: 0, minimum: 0, maximum: 9999 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  order?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
