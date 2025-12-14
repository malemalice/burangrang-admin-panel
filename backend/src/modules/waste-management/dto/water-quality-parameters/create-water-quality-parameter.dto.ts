import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateWaterQualityParameterDto {
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
  unit: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  standardLimit?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  regulatoryLimit?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  testMethod?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
