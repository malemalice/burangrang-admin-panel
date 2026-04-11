import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsUUID, IsBoolean, IsDateString, IsObject } from 'class-validator';

export class FileUploadDto {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  originalName: string;

  @ApiProperty()
  @Expose()
  @IsString()
  storedName: string;

  @ApiProperty()
  @Expose()
  @IsString()
  mimeType: string;

  @ApiProperty()
  @Expose()
  size: number;

  @ApiProperty()
  @Expose()
  @IsString()
  hash: string;

  @ApiProperty({ enum: ['local', 'aws-s3'] })
  @Expose()
  @IsString()
  storageProvider: string;

  @ApiProperty()
  @Expose()
  @IsUUID()
  categoryId: string;

  @ApiProperty()
  @Expose()
  @IsUUID()
  uploadedBy: string;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty()
  @Expose()
  @IsString()
  accessToken: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsObject()
  metadata?: any;

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

  // Relations
  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  category?: any;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  uploader?: any;

  // Computed properties - using @Transform to ensure they're serialized
  @ApiProperty()
  @Expose()
  downloadUrl: string;

  @ApiProperty()
  @Expose()
  fileExtension: string;

  @ApiProperty()
  @Expose()
  isExpired: boolean;

  constructor(partial: Partial<FileUploadDto>) {
    Object.assign(this, partial);
  }
}
