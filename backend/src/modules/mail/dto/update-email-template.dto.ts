import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateEmailTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subjectTemplate?: string;

  @IsString()
  @IsOptional()
  bodyTemplate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


