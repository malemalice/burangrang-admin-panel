import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { InvestigationCauseSectionEnum } from '@prisma/client';

export class HfacsNodeDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  parentId?: string | null;

  @ApiProperty({ enum: InvestigationCauseSectionEnum })
  @Expose()
  section: InvestigationCauseSectionEnum;

  @ApiProperty({ description: '0 = Tier1 (category), 1 = Tier2 (sub-category), 2 = Item (leaf)' })
  @Expose()
  depth: number;

  @ApiProperty({ required: false, nullable: true, description: 'Stable code, e.g. "OC_001" — typically set on leaf items only' })
  @Expose()
  code?: string | null;

  @ApiProperty()
  @Expose()
  labelEn: string;

  @ApiProperty()
  @Expose()
  labelId: string;

  @ApiProperty({ description: 'True for "Others / Lain-lain" items — UI exposes a free-text customNotes input when selected' })
  @Expose()
  isOther: boolean;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  deletedAt?: Date | null;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ required: false, type: () => HfacsNodeDto, nullable: true })
  @Expose()
  parent?: HfacsNodeDto | null;

  @ApiProperty({ required: false, type: () => [HfacsNodeDto] })
  @Expose()
  children?: HfacsNodeDto[];

  constructor(partial: Partial<HfacsNodeDto>) {
    Object.assign(this, partial);
  }
}
