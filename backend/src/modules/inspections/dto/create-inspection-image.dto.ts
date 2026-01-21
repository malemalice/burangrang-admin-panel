import { IsString, IsOptional, IsInt, IsNotEmpty, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InspectionImageTypeEnum } from '@prisma/client';

export class CreateInspectionImageDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  imageUrl: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  caption?: string;

  @IsOptional()
  @IsEnum(InspectionImageTypeEnum)
  @ApiProperty({ enum: InspectionImageTypeEnum, required: false, default: InspectionImageTypeEnum.GENERAL })
  type?: InspectionImageTypeEnum;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({ minimum: 0 })
  order: number;
}

