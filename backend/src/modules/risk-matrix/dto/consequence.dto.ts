import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ConsequenceDto {
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
  level: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<ConsequenceDto>) {
    Object.assign(this, partial);
  }
}
