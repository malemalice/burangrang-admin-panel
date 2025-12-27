import {
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({ minimum: 1 })
  order: number;
}

