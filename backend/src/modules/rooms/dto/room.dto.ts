import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Expose } from 'class-transformer';

export class RoomDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @Expose()
  areaId: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  area?: {
    id: string;
    name: string;
    code: string;
  };

  constructor(partial: Partial<RoomDto>) {
    Object.assign(this, partial);
  }
}
