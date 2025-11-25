import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class AssignEnrollmentDto {
  @ApiProperty({
    description: 'User ID to assign course to',
    example: '25ee0583-8696-4dc9-a189-e1dd63f07a62',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Course ID to assign',
    example: '25ee0583-8696-4dc9-a189-e1dd63f07a62',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @ApiProperty({
    description: 'Due date for course completion',
    required: false,
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description: 'Whether enrollment is required',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = false;

  @ApiProperty({
    description: 'Assignment notes or instructions',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Send email notification to user',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean = true;
}
