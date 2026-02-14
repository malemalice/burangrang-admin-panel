import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';

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
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
