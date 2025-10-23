import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsUUID, IsBoolean, IsObject, IsNumber } from 'class-validator';

export class FileCategoryDto {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  name: string;

  @ApiProperty()
  @Expose()
  @IsObject()
  allowedTypes: string[];

  @ApiProperty()
  @Expose()
  @IsNumber()
  maxSize: number;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<FileCategoryDto>) {
    Object.assign(this, partial);
  }
}
