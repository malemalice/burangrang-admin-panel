import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnvironmentalMeasurementDto {
  @ApiProperty({ description: 'Room ID' })
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ description: 'Lighting level (lux)', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lighting?: number;

  @ApiProperty({ description: 'Noise level (dB)', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  noise?: number;

  @ApiProperty({ description: 'Humidity percentage (%)', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  humidity?: number;

  @ApiProperty({ description: 'Temperature (°C)', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  temperature?: number;

  @ApiProperty({ description: 'Remarks or notes', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({ description: 'Measurement date' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
