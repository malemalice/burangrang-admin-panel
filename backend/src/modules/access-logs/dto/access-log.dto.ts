import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsObject,
  IsUUID,
} from 'class-validator';

export class AccessLogDto {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty()
  @Expose()
  @IsString()
  method: string;

  @ApiProperty()
  @Expose()
  @IsString()
  endpoint: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsNumber()
  executionTime?: number;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };

  constructor(partial?: Partial<AccessLogDto>) {
    Object.assign(this, partial ?? {});
  }
}
