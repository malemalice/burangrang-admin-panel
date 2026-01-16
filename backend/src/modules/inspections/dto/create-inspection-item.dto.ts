import {
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  IsNotEmpty,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GeneralStatusEnum } from '@prisma/client';
import { CreateInspectionImageDto } from './create-inspection-image.dto';

export class CreateInspectionItemDto {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  riskCategoryId: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  riskId: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  assignedDepartmentId: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  assigneeId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  followUpNotes?: string;

  @IsOptional()
  @IsEnum(GeneralStatusEnum)
  @ApiProperty({ enum: GeneralStatusEnum, required: false })
  status?: GeneralStatusEnum;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({ minimum: 0 })
  order: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInspectionImageDto)
  @ApiProperty({ type: [CreateInspectionImageDto], required: false })
  images?: CreateInspectionImageDto[];
}

