import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class WorkClassificationRiskMitigationInputDto {
  @ApiProperty({ description: 'Hazard' })
  @IsString()
  @IsNotEmpty()
  hazard: string;

  @ApiProperty({ description: 'Mitigation' })
  @IsString()
  @IsNotEmpty()
  mitigation: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class WorkClassificationRiskMitigationItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  hazard: string;

  @ApiProperty()
  @Expose()
  mitigation: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}

