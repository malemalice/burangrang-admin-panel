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
  IsUUID,
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

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  hfacsNodeId?: string | null;

  constructor(partial: Partial<InvestigationCauseDto>) {
    Object.assign(this, partial);
  }
}

export class UpsertInvestigationCauseDto {
  // Preferred: reference the HFACS master node — the service derives snapshot fields
  // (section, tier1, tier2, causeKey, causeName) from the node + its ancestors at write time.
  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false, description: 'HFACS master node ID (depth=2 leaf item). When provided, snapshot fields are derived server-side.' })
  hfacsNodeId?: string;

  // Legacy / fallback fields — optional now that hfacsNodeId is preferred. Still accepted for
  // back-compatibility with clients that send the snapshot directly.
  @IsEnum(InvestigationCauseSectionEnum)
  @IsOptional()
  @ApiProperty({ required: false, enum: InvestigationCauseSectionEnum })
  section?: InvestigationCauseSectionEnum;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  tier1?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  tier2?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'HFACS canonical key e.g. OC_001' })
  causeKey?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  causeName?: string;

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
