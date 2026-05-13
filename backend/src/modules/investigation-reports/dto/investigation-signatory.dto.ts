import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InvestigationSignatoryRoleEnum } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class InvestigationSignatoryDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  investigationReportId: string;

  @ApiProperty({ enum: InvestigationSignatoryRoleEnum, required: false })
  @Expose()
  signatoryRole?: InvestigationSignatoryRoleEnum;

  @ApiProperty({ required: false })
  @Expose()
  roleName?: string;

  @ApiProperty({ required: false })
  @Expose()
  name?: string;

  @ApiProperty({ required: false })
  @Expose()
  signedAt?: Date;

  @ApiProperty()
  @Expose()
  order: number;

  constructor(partial: Partial<InvestigationSignatoryDto>) {
    Object.assign(this, partial);
  }
}

export class UpsertInvestigationSignatoryDto {
  @IsEnum(InvestigationSignatoryRoleEnum)
  @IsOptional()
  @ApiProperty({ enum: InvestigationSignatoryRoleEnum, required: false })
  signatoryRole?: InvestigationSignatoryRoleEnum;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  roleName?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  name?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({ required: false })
  signedAt?: Date;

  @IsInt()
  @IsOptional()
  @ApiProperty({ required: false, default: 0 })
  order?: number;
}
