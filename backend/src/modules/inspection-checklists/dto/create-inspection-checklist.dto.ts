import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUUID,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateInspectionChecklistDto {
  @ApiProperty({ description: 'Template name (depth 0) or item label (depth 1/2)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Parent ID — null for template roots (depth 0), required for categories (depth 1) and leaf items (depth 2)',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Unique code for root templates; display code "1", "A" for child items',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: 0, minimum: 0, maximum: 9999 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  order?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
