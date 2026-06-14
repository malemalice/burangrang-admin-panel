import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
