import { IsString, IsOptional, IsNotEmpty, IsInt, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum EquipmentEntityEnum {
  ASSET = 'ASSET',
  HEAVY_EQUIPMENT = 'HEAVY_EQUIPMENT',
  SAFETY_EQUIPMENT = 'SAFETY_EQUIPMENT',
}

export class CreateIncidentAssetDto {
  @IsEnum(EquipmentEntityEnum)
  @IsOptional()
  @ApiProperty({ enum: EquipmentEntityEnum, required: false })
  entity?: EquipmentEntityEnum;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  entityId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  assetName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  assetCode?: string;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) || num < 1 ? undefined : Math.floor(num);
  })
  @IsInt()
  @IsOptional()
  @ApiProperty({ required: false })
  quantity?: number;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  order: number;
}
