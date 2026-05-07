import {
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GenderEnum } from '@prisma/client';

export class CreateIncidentWitnessDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  witnessName?: string;

  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsEnum(GenderEnum)
  @IsOptional()
  @ApiProperty({ enum: GenderEnum, required: false })
  gender?: GenderEnum;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Job position/title at time of incident' })
  position?: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false })
  departmentId?: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  order: number;
}
