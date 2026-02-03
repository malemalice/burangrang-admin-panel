import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { DataLevelEnum } from '@prisma/client';

export class CreateRoleDto {
  @ApiProperty({ description: 'Name of the role' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Code of the role' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Description of the role', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'List of permissions for the role' })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({ description: 'Whether the role is active' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Data access level for the role',
    enum: DataLevelEnum,
    default: DataLevelEnum.SUPER,
  })
  @IsEnum(DataLevelEnum)
  @IsOptional()
  dataLevel?: DataLevelEnum;
}
