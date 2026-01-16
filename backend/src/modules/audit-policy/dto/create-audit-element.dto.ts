import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAuditElementDto {
  @ApiProperty({ description: 'The name of the audit element' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The unique code of the audit element' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    required: false,
    description: 'The description of the audit element',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    default: true,
    description: 'Whether the audit element is active',
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  isActive?: boolean = true;
}
