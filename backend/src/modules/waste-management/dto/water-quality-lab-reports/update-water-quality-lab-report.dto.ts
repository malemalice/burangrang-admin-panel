import { PartialType } from '@nestjs/swagger';
import {
  CreateWaterQualityLabReportDto,
  CreateWaterQualityLabReportResultDto,
} from './create-water-quality-lab-report.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWaterQualityLabReportDto extends PartialType(
  CreateWaterQualityLabReportDto,
) {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  receivedBy?: string;
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  receivedAt?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reviewedBy?: string;
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  reviewedAt?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reviewNotes?: string;
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
