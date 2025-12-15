import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum MonthEnum {
  JAN = 'JAN', FEB = 'FEB', MAR = 'MAR', APR = 'APR', MAY = 'MAY', JUN = 'JUN',
  JUL = 'JUL', AUG = 'AUG', SEP = 'SEP', OCT = 'OCT', NOV = 'NOV', DEC = 'DEC',
}

export class CreateWeightReportItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() wasteTypeId: string;
  @ApiProperty() @IsNumber() weight: number;
  @ApiProperty({ required: false, default: 'kg' }) @IsString() @IsOptional() unit?: string;
  @ApiProperty() @IsNumber() order: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class CreateWeightReportDto {
  @ApiProperty() @IsString() @IsNotEmpty() reportCode: string;
  @ApiProperty() @IsString() @IsNotEmpty() sourceId: string;
  @ApiProperty() @IsString() @IsNotEmpty() storageLocationId: string;
  @ApiProperty() @IsDateString() reportDate: string;
  @ApiProperty({ enum: MonthEnum }) @IsEnum(MonthEnum) reportMonth: MonthEnum;
  @ApiProperty() @IsNumber() reportYear: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() reportDocumentUrl?: string;
  @ApiProperty() @IsDateString() submittedAt: string;
  @ApiProperty({ required: false }) @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiProperty({ type: [CreateWeightReportItemDto], required: false }) @IsArray() @ValidateNested({ each: true }) @Type(() => CreateWeightReportItemDto) @IsOptional() items?: CreateWeightReportItemDto[];
}
