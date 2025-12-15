import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsequenceDto {
  @ApiProperty({ description: 'The name of the consequence level' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The description of the consequence level' })
  @IsString()
  @IsNotEmpty()
  desc: string;

  @ApiProperty({ description: 'The level identifier (A, B, C, D, E)' })
  @IsString()
  @IsNotEmpty()
  level: string;

  @ApiProperty({ description: 'Whether the consequence is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
