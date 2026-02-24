import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateTreatmentPlantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  officeId?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
