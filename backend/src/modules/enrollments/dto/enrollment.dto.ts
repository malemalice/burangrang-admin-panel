import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EnrollmentDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty()
  @Expose()
  courseId: string;

  @ApiProperty({ required: false })
  @Expose()
  orderId?: string;

  @ApiProperty()
  @Expose()
  status: string;

  @ApiProperty()
  @Expose()
  enrolledAt: Date;

  @ApiProperty({ required: false })
  @Expose()
  completedAt?: Date;

  @ApiProperty()
  @Expose()
  progress: number;

  @ApiProperty({ required: false })
  @Expose()
  lastAccessedAt?: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<EnrollmentDto>) {
    Object.assign(this, partial);
  }
}
