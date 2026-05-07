import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class InvestigationCostDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  investigationReportId: string;

  @ApiProperty({ default: 'IDR' })
  @Expose()
  currency: string;

  @ApiProperty({ required: false, type: Number })
  @Expose()
  medicalCost?: number | null;

  @ApiProperty({ required: false, type: Number })
  @Expose()
  lostTimeCost?: number | null;

  @ApiProperty({ required: false, type: Number })
  @Expose()
  damageCost?: number | null;

  @ApiProperty({ required: false, type: Number })
  @Expose()
  repairCost?: number | null;

  @ApiProperty({ required: false, type: Number })
  @Expose()
  compensationCost?: number | null;

  @ApiProperty({ required: false, type: Number })
  @Expose()
  otherCost?: number | null;

  @ApiProperty()
  @Expose()
  isNotYetKnown: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<InvestigationCostDto>) {
    Object.assign(this, partial);
  }
}

export class UpsertInvestigationCostDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, default: 'IDR' })
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false })
  medicalCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false })
  lostTimeCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false })
  damageCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false })
  repairCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false })
  compensationCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false })
  otherCost?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: false })
  isNotYetKnown?: boolean;
}
