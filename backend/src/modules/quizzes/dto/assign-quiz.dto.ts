import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsBoolean, IsDateString, IsNotEmpty } from 'class-validator';

export class AssignQuizDto {
  @ApiProperty({ description: 'User IDs to assign quiz to', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  userIds: string[];

  @ApiProperty({ description: 'Due date for completion', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ description: 'Whether assignment is required', default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = false;

  @ApiProperty({ description: 'Assignment notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
