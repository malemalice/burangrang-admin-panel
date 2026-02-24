import { PartialType } from '@nestjs/swagger';
import { CreateWeightReportDto } from './create-weight-report.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum WeightReportStatusEnum {
  SCHEDULED = 'SCHEDULED',
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  DONE = 'DONE',
  REJECTED = 'REJECTED',
}

export class UpdateWeightReportDto extends PartialType(CreateWeightReportDto) {
  @ApiProperty({ required: false, enum: WeightReportStatusEnum })
  @IsEnum(WeightReportStatusEnum)
  @IsOptional()
  status?: WeightReportStatusEnum;
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
