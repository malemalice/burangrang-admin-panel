import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateOfficeDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 