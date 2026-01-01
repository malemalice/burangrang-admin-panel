import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralStatusEnum } from '@prisma/client';
import { CreateInspectionItemDto } from './create-inspection-item.dto';
import { CreateInspectionInspectorDto } from './create-inspection-inspector.dto';

export class CreateInspectionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  code: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  areaId: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty()
  inspectionDate: Date;

  @IsNotEmpty()
  @IsEnum(GeneralStatusEnum)
  @ApiProperty({ enum: GeneralStatusEnum })
  status: GeneralStatusEnum;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, default: true })
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInspectionItemDto)
  @IsOptional()
  @ApiProperty({ type: [CreateInspectionItemDto], required: false })
  items?: CreateInspectionItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInspectionInspectorDto)
  @IsOptional()
  @ApiProperty({ type: [CreateInspectionInspectorDto], required: false })
  inspectors?: CreateInspectionInspectorDto[];
}

