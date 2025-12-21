import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateAreaDto {
  @ApiProperty({ description: 'Area name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Area code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Area description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Office ID' })
  @IsUUID()
  @IsOptional()
  officeId?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
