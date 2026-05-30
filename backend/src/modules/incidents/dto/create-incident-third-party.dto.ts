import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderEnum } from '@prisma/client';

export class CreateIncidentThirdPartyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsEnum(GenderEnum)
  @IsOptional()
  @ApiPropertyOptional({ enum: GenderEnum })
  gender?: GenderEnum;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  company?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Job position/title of the external person' })
  position?: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  order: number;
}
