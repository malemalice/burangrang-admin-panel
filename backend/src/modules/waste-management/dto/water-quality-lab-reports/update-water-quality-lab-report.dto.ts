import { PartialType } from '@nestjs/swagger';
import { CreateWaterQualityLabReportDto } from './create-water-quality-lab-report.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum ReportStatusEnum {
  SCHEDULED = 'SCHEDULED',
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  DONE = 'DONE',
  REJECTED = 'REJECTED',
}

export class UpdateWaterQualityLabReportDto extends PartialType(
  CreateWaterQualityLabReportDto,
) {
  @ApiProperty({ required: false, enum: ReportStatusEnum })
  @IsEnum(ReportStatusEnum)
  @IsOptional()
  status?: ReportStatusEnum;
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
}
