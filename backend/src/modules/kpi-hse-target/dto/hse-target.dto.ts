import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HseTargetTypeEnum, MonthEnum } from '@prisma/client';

export class HseTargetDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: HseTargetTypeEnum })
  type: HseTargetTypeEnum;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ enum: MonthEnum })
  month?: MonthEnum;

  @ApiProperty()
  year: number;

  @ApiProperty()
  target: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdBy: string;

  @ApiPropertyOptional()
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };

  constructor(partial: Partial<HseTargetDto>) {
    Object.assign(this, partial);
  }
}
