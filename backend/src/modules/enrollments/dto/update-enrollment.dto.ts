import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';

export enum EnrollmentStatusEnum {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export class UpdateEnrollmentDto {
  @ApiProperty({
    description: 'Enrollment status',
    enum: EnrollmentStatusEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatusEnum)
  status?: EnrollmentStatusEnum;

  @ApiProperty({
    description: 'Due date for course completion',
    required: false,
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description: 'Assignment notes or instructions',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
