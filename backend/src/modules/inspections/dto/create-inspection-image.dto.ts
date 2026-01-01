import { IsString, IsOptional, IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInspectionImageDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  imageUrl: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  caption?: string;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({ minimum: 0 })
  order: number;
}

