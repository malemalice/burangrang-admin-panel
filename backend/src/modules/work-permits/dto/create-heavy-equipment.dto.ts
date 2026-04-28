import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHeavyEquipmentDto {
  @ApiProperty({ description: 'Heavy equipment display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description:
      'Optional code; if omitted, generated from name (uppercase, hyphenated)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @ApiProperty({ description: 'Optional description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
