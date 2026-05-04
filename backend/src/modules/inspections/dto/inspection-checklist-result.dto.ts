import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { InspectionRiskRateEnum } from '@prisma/client';

export class CreateInspectionChecklistResultDto {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ description: 'Leaf checklist item ID (depth-2 node)' })
  checklistItemId: string;

  @IsOptional()
  @IsEnum(InspectionRiskRateEnum)
  @ApiProperty({ enum: InspectionRiskRateEnum, required: false })
  riskRate?: InspectionRiskRateEnum;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  notes?: string;
}

export class ChecklistItemParentDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  code?: string | null;
}

export class ChecklistItemSummaryDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  code?: string | null;

  @ApiProperty({ type: ChecklistItemParentDto, required: false, nullable: true })
  @Expose()
  parent?: ChecklistItemParentDto | null;
}

export class InspectionChecklistResultDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  inspectionItemId: string;

  @ApiProperty()
  @Expose()
  checklistItemId: string;

  @ApiProperty({ enum: InspectionRiskRateEnum, required: false })
  @Expose()
  riskRate?: InspectionRiskRateEnum;

  @ApiProperty({ required: false })
  @Expose()
  notes?: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ type: ChecklistItemSummaryDto, required: false })
  @Expose()
  checklistItem?: ChecklistItemSummaryDto;

  constructor(partial: Partial<InspectionChecklistResultDto>) {
    Object.assign(this, partial);
  }
}
