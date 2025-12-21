import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateChapterDto } from './create-chapter.dto';

export class UpdateChapterDto extends PartialType(CreateChapterDto) {
  @ApiProperty({
    description: 'Course ID this chapter belongs to',
    required: false,
  })
  @IsOptional()
  courseId?: string;

  @ApiProperty({ description: 'Chapter published date', required: false })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }: { value: any }) => {
    if (!value) return null;
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return value instanceof Date ? value : null;
  })
  publishedAt?: Date;

  @ApiProperty({ description: 'Whether chapter is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
