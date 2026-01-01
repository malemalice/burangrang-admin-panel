import {
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  IsNotEmpty,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  followUpNotes?: string;

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

