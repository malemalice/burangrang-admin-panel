import { PartialType } from '@nestjs/swagger';
import { CreateMonthlyFlowReportDto } from './create-monthly-flow-report.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum ReportStatusEnum {
  SUBMITTED = 'SUBMITTED', RECEIVED = 'RECEIVED', UNDER_REVIEW = 'UNDER_REVIEW', REVIEWED = 'REVIEWED', ARCHIVED = 'ARCHIVED',
}

export class UpdateMonthlyFlowReportDto extends PartialType(CreateMonthlyFlowReportDto) {
  @ApiProperty({ required: false, enum: ReportStatusEnum }) @IsEnum(ReportStatusEnum) @IsOptional() status?: ReportStatusEnum;
  @ApiProperty({ required: false }) @IsString() @IsOptional() receivedBy?: string;
  @ApiProperty({ required: false }) @IsDateString() @IsOptional() receivedAt?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() reviewedBy?: string;
  @ApiProperty({ required: false }) @IsDateString() @IsOptional() reviewedAt?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() reviewNotes?: string;
  @ApiProperty({ required: false }) @IsDateString() @IsOptional() archivedAt?: string;
}
