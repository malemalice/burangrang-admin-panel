import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { FindAllQueryDto } from '../../../shared/types/pagination-params';
import { WorkPermitStatusEnum } from './work-permit.dto';

export class FindWorkPermitsDto extends FindAllQueryDto {
  @ApiProperty({
    description: 'Filter by status',
    enum: WorkPermitStatusEnum,
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Filter by company ID',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({
    description: 'Filter by area ID',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  areaId?: string;

  @ApiProperty({
    description: 'Filter by created by user ID',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({
    description: 'Filter by start date (from)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiProperty({
    description: 'Filter by start date (to)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiProperty({
    description: 'Filter by end date (from)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @ApiProperty({
    description: 'Filter by end date (to)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endDateTo?: string;
}
