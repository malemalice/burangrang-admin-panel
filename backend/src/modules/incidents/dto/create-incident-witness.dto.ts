import {
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GenderEnum } from '@prisma/client';

export class CreateIncidentWitnessDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  witnessName?: string;

  @IsEnum(GenderEnum)
  @IsOptional()
  @ApiProperty({ enum: GenderEnum, required: false })
  gender?: GenderEnum;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false })
  departmentId?: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  order: number;
}
