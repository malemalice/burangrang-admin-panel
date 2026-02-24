import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWaterQualityLabReportResultDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  parameterId: string;

  @ApiProperty()
  @IsNumber()
  resultValue: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isCompliant?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateWaterQualityLabReportDto {
  @ApiProperty() @IsString() @IsNotEmpty() reportCode: string;
  @ApiProperty() @IsString() @IsNotEmpty() treatmentPlantId: string;
  @ApiProperty() @IsDateString() reportDate: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reportDocumentUrl?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() summary?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  recommendations?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  analystSignature?: string;
  @ApiProperty() @IsDateString() submittedAt: string;
  @ApiProperty({
    type: [CreateWaterQualityLabReportResultDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWaterQualityLabReportResultDto)
  @IsOptional()
  results?: CreateWaterQualityLabReportResultDto[];
}
