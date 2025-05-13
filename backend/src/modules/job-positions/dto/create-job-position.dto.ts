import { IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

export class CreateJobPositionDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsInt()
  @Min(1)
  level: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 