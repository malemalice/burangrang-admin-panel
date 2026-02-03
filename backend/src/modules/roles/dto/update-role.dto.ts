import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { DataLevelEnum } from '@prisma/client';

export class UpdateRoleDto {
  @ApiProperty({ description: 'Name of the role', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Code of the role', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'Description of the role', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'List of permissions for the role',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @ApiProperty({ description: 'Whether the role is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Data access level for the role',
    enum: DataLevelEnum,
    required: false,
  })
  @IsEnum(DataLevelEnum)
  @IsOptional()
  dataLevel?: DataLevelEnum;
}
