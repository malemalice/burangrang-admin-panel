import { IsString, IsOptional, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncidentImageDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  imageUrl: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  caption?: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  order: number;
}
