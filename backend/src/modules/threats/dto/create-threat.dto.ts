import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateThreatDto {
  @ApiProperty({ description: 'The name of the threat' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'A unique code for the threat' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Optional description of the threat', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Whether the threat is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'The ID of the HSE category this threat belongs to' })
  @IsUUID()
  hseCategoryId: string;
} 