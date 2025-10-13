import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'Course ID to enroll in',
    example: '25ee0583-8696-4dc9-a189-e1dd63f07a62',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;
}
