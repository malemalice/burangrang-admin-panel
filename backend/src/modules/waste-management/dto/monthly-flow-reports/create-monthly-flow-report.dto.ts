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

export enum MonthEnum {
  JAN = 'JAN',
  FEB = 'FEB',
  MAR = 'MAR',
  APR = 'APR',
  MAY = 'MAY',
  JUN = 'JUN',
  JUL = 'JUL',
  AUG = 'AUG',
  SEP = 'SEP',
  OCT = 'OCT',
  NOV = 'NOV',
  DEC = 'DEC',
}

export class CreateMonthlyFlowReportDto {
  @ApiProperty() @IsString() @IsNotEmpty() reportCode: string;
  @ApiProperty() @IsString() @IsNotEmpty() treatmentPlantId: string;
  @ApiProperty({ enum: MonthEnum }) @IsEnum(MonthEnum) reportMonth: MonthEnum;
  @ApiProperty() @IsNumber() reportYear: number;
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
