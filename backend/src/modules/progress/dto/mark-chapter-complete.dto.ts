import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MarkChapterCompleteDto {
  @ApiProperty({ 
    description: 'Optional time spent on chapter in seconds', 
    required: false,
    example: 3600
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeSpent?: number;
}

