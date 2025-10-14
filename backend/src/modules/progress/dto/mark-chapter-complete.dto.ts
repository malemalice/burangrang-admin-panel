import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class MarkChapterCompleteDto {
  @ApiProperty({ description: 'Chapter ID to mark as complete' })
  @IsString()
  chapterId: string;

  @ApiProperty({ description: 'Optional time spent on chapter in seconds', required: false })
  @IsOptional()
  @IsInt()
  timeSpent?: number;
}

