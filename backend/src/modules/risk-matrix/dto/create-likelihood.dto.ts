import { IsString, IsInt, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLikelihoodDto {
  @ApiProperty({ description: 'The name of the likelihood level' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The description of the likelihood level' })
  @IsString()
  @IsNotEmpty()
  desc: string;

  @ApiProperty({ description: 'The numeric level (1-5)' })
  @IsInt()
  level: number;

  @ApiProperty({ description: 'Whether the likelihood is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
