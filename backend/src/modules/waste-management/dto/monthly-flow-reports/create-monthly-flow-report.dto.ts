import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { MonthEnum } from '@prisma/client';

export { MonthEnum };

export class CreateMonthlyFlowReportDto {
  @ApiProperty() @IsString() @IsNotEmpty() reportCode: string;
  @ApiProperty() @IsString() @IsNotEmpty() treatmentPlantId: string;
  @ApiProperty() @IsDateString() reportDate: string;
  @ApiProperty({ enum: MonthEnum, required: false })
  @IsEnum(MonthEnum)
  @IsOptional()
  reportMonth?: MonthEnum;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() reportYear?: number;
  @ApiProperty() @IsNumber() totalVolume: number;
  @ApiProperty() @IsNumber() averageDailyFlow: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() peakFlow?: number;
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  minimumFlow?: number;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reportDocumentUrl?: string;
  @ApiProperty() @IsDateString() submittedAt: string;
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
