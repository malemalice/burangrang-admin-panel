import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export enum WasteTypeEnum {
  DOMESTIC = 'DOMESTIC',
  HAZARDOUS = 'HAZARDOUS',
  FOOD = 'FOOD',
  GREEN = 'GREEN',
}

export class CreateWasteTypeDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsString() @IsNotEmpty() code: string;
  @ApiProperty({ enum: WasteTypeEnum })
  @IsEnum(WasteTypeEnum)
  wasteType: WasteTypeEnum;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  requiresSpecialHandling?: boolean;
  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
