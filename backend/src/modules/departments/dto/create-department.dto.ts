import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'The name of the department' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The unique code of the department' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ required: false, description: 'The description of the department' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ default: true, description: 'Whether the department is active' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean = true;
} 