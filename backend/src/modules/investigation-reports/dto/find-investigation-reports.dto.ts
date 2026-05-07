import { IsOptional, IsUUID, IsEnum, IsBoolean, IsString, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { InvestigationStatusEnum } from '@prisma/client';

export class FindInvestigationReportsDto {
  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ required: false })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ required: false })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  sortBy?: string;

  @IsOptional()
  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  @ApiProperty({ required: false })
  isActive?: boolean;

  @IsOptional()
  @IsEnum(InvestigationStatusEnum, { each: true })
  @ApiProperty({ required: false, enum: InvestigationStatusEnum, isArray: true })
  status?: InvestigationStatusEnum | InvestigationStatusEnum[];

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  incidentId?: string;

  @IsOptional()
  @IsUUID(undefined, { each: true })
  @ApiProperty({ required: false, isArray: true })
  areaId?: string | string[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({ required: false, description: 'Incident date >= this date' })
  incidentDateFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({ required: false, description: 'Incident date <= this date' })
  incidentDateTo?: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Search by report number or incident code/subject' })
  search?: string;
}
