import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { InvestigationCauseSectionEnum } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class InvestigationCauseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  investigationReportId: string;

  @ApiProperty({ enum: InvestigationCauseSectionEnum })
  @Expose()
  section: InvestigationCauseSectionEnum;

  @ApiProperty()
  @Expose()
  tier1: string;

  @ApiProperty()
  @Expose()
  tier2: string;

  @ApiProperty()
  @Expose()
  causeKey: string;

  @ApiProperty()
  @Expose()
  causeName: string;

  @ApiProperty()
  @Expose()
  isSelected: boolean;

  @ApiProperty({ required: false })
  @Expose()
  customNotes?: string;

  @ApiProperty()
  @Expose()
  order: number;

  constructor(partial: Partial<InvestigationCauseDto>) {
    Object.assign(this, partial);
  }
}

export class UpsertInvestigationCauseDto {
  @IsEnum(InvestigationCauseSectionEnum)
  @ApiProperty({ enum: InvestigationCauseSectionEnum })
  section: InvestigationCauseSectionEnum;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  tier1: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  tier2: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'HFACS canonical key e.g. OC_001' })
  causeKey: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  causeName: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, default: true })
  isSelected?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Free-text for "Others" entries' })
  customNotes?: string;

  @IsInt()
  @IsOptional()
  @ApiProperty({ required: false, default: 0 })
  order?: number;
}
