import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class WaterQualityLabReportAttachmentDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  fileUrl: string;

  @ApiProperty({ required: false })
  @Expose()
  fileName?: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  constructor(partial: Partial<WaterQualityLabReportAttachmentDto>) {
    Object.assign(this, partial);
  }
}

export class CreateWaterQualityLabReportAttachmentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fileUrl: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  fileName?: string;

  @IsInt()
  @ApiProperty()
  order: number;
}
