import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Name of the role' })
  @IsString()
  name: string;

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
} 