import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRiskCategoryDto {
  @ApiProperty({ description: 'The name of the risk category' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'A unique code for the risk category' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Optional description of the risk category', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Whether the category is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 