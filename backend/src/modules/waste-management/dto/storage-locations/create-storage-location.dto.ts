import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateStorageLocationDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsString() @IsNotEmpty() code: string;
  @ApiProperty() @IsString() @IsNotEmpty() location: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() areaId?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ required: false }) @IsBoolean() @IsOptional() isActive?: boolean;
}
