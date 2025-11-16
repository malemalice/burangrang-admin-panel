import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmailTemplateDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subjectTemplate: string;

  @IsString()
  @IsNotEmpty()
  bodyTemplate: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


