import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LikelihoodDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  desc: string;

  @ApiProperty()
  @Expose()
  level: number;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<LikelihoodDto>) {
    Object.assign(this, partial);
  }
}
