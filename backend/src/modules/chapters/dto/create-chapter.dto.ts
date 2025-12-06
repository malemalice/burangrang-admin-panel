import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsInt, IsEnum, IsBoolean, Min, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChapterDto {
  @ApiProperty({ description: 'Course ID this chapter belongs to' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'Chapter title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Chapter description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Chapter order in the course' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  order: number;

  @ApiProperty({ description: 'Chapter duration in minutes', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  duration?: number = 0;

  @ApiProperty({ 
    description: 'Content type', 
    enum: ['video', 'pdf', 'text', 'youtube'],
    default: 'video'
  })
  @IsEnum(['video', 'pdf', 'text', 'youtube'])
  contentType: string = 'video';

  @ApiProperty({ 
    description: 'Content URL for video/pdf files', 
    required: false,
    example: 'https://example.com/videos/chapter1.mp4'
  })
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiProperty({ 
    description: 'YouTube video ID for YouTube content', 
    required: false,
    example: 'dQw4w9WgXcQ'
  })
  @IsOptional()
  @IsString()
  youtubeVideoId?: string;

  @ApiProperty({ 
    description: 'Text content for text-based chapters', 
    required: false 
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Whether chapter is free to access', default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean = false;

  @ApiProperty({ description: 'Whether chapter is published', default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = false;
}
