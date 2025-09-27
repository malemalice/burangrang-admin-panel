import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsUUID, IsBoolean, IsObject } from 'class-validator';

export class FileStorageProviderDto {
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
  config: any;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isDefault: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<FileStorageProviderDto>) {
    Object.assign(this, partial);
  }
}
