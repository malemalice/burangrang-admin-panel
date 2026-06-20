import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompliantStatusEnum, GeneralStatusEnum } from '@prisma/client';

class AuditImageDto {
  @ApiProperty()
  @IsString()
  imageUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  order: number;
}

export class CreateAuditItemDto {
  @ApiProperty()
  @IsUUID()
  auditCriteriaId: string;

  @ApiProperty({ enum: GeneralStatusEnum, required: false })
  @IsOptional()
  @IsEnum(GeneralStatusEnum)
  status?: GeneralStatusEnum;

  @ApiProperty({ enum: CompliantStatusEnum })
  @IsEnum(CompliantStatusEnum)
  compliantStatus: CompliantStatusEnum;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  departmentIds: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  evidence?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recommendation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  actionRealization?: string;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({ type: [AuditImageDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditImageDto)
  images?: AuditImageDto[];
}
