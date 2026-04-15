import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/** Payload item for create/update work classification (no id) */
export class WorkClassificationAttachmentInputDto {
  @ApiProperty({ description: 'File URL (from upload)' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiPropertyOptional({ description: 'MIME or extension hint' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Display order' })
  @IsInt()
  @Min(0)
  order: number;
}

/** API response item for a stored attachment */
export class WorkClassificationAttachmentItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  fileUrl: string;

  @ApiProperty()
  @Expose()
  fileName: string;

  @ApiPropertyOptional()
  @Expose()
  fileType?: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
