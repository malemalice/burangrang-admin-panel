import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'List of permission names to assign',
    type: [String],
    example: ['quiz:create', 'quiz:publish'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  permissionNames: string[];
}
