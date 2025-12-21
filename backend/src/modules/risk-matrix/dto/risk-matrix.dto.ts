import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RiskRatingEnum } from '@prisma/client';

export class RiskMatrixDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  likelihoodLevel: number;

  @ApiProperty()
  @Expose()
  likelihoodName: string;

  @ApiProperty()
  @Expose()
  likelihoodDesc: string;

  @ApiProperty()
  @Expose()
  consequenceLevel: string;

  @ApiProperty()
  @Expose()
  consequenceName: string;

  @ApiProperty()
  @Expose()
  consequenceDesc: string;

  @ApiProperty({ enum: RiskRatingEnum })
  @Expose()
  risk_rating: RiskRatingEnum;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<RiskMatrixDto>) {
    Object.assign(this, partial);
  }
}
