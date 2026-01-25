import { IsString, IsOptional, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncidentAssetDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  assetName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  assetCode?: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  order: number;
}
