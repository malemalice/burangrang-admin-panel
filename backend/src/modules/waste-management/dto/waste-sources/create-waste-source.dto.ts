import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  ValidateIf,
} from 'class-validator';

export class CreateWasteSourceDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsString() @IsNotEmpty() code: string;
  @ApiProperty() @IsString() @IsNotEmpty() sourceType: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactPerson?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() phone?: string;
  @ApiProperty({ required: false })
  @ValidateIf((o) => o.email !== '')
  @IsEmail()
  @IsOptional()
  email?: string;
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
