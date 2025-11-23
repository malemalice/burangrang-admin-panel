import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateCourseDto } from './create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiProperty({ description: 'Whether course is published', required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ description: 'Course published date', required: false })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : null)
  publishedAt?: Date | null;

  @ApiProperty({ description: 'Whether course is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
