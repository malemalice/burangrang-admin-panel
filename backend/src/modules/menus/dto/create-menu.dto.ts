import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({
    description: 'Name of the menu item',
    example: 'Dashboard'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'URL path for the menu item',
    example: '/dashboard',
    required: false
  })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiProperty({
    description: 'Icon name for the menu item',
    example: 'LayoutDashboard',
    required: false
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    description: 'Parent menu ID for hierarchical structure',
    example: 'uuid-string',
    required: false
  })
  @IsString()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({
    description: 'Display order of the menu item',
    example: 1,
    minimum: 0,
    maximum: 999
  })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  @Max(999)
  order: number;

  @ApiProperty({
    description: 'Array of role IDs that can access this menu',
    example: ['role-uuid-1', 'role-uuid-2'],
    required: false,
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];
}
