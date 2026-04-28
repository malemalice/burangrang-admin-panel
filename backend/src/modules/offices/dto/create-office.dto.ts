import { IsString, IsOptional, IsUUID, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateOfficeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
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
