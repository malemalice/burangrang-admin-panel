import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';

export class ChapterDto {
  @ApiProperty({ description: 'Chapter unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Course ID this chapter belongs to' })
  @Expose()
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'Chapter title' })
  @Expose()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Chapter description', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Chapter order in the course' })
  @Expose()
  @IsInt()
  order: number;

  @ApiProperty({ description: 'Chapter duration in minutes' })
  @Expose()
  @IsInt()
  duration: number;

  @ApiProperty({ 
    description: 'Content type', 
    enum: ['video', 'pdf', 'text', 'youtube'] 
  })
  @Expose()
  @IsEnum(['video', 'pdf', 'text', 'youtube'])
  contentType: string;

  @ApiProperty({ description: 'Content URL for video/pdf files', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiProperty({ description: 'YouTube video ID for YouTube content', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  youtubeVideoId?: string;

  @ApiProperty({ description: 'Text content for text-based chapters', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Whether chapter is free to access' })
  @Expose()
  @IsBoolean()
  isFree: boolean;

  @ApiProperty({ description: 'Whether chapter is published' })
  @Expose()
  @IsBoolean()
  isPublished: boolean;

  @ApiProperty({ description: 'Chapter published date', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  publishedAt?: Date;

  @ApiProperty({ description: 'Whether chapter is active' })
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Chapter creation date' })
  @Expose()
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ description: 'Chapter last update date' })
  @Expose()
  @IsDateString()
  updatedAt: Date;

  // Relations (optional, included when requested)
  @ApiProperty({ description: 'Course information', required: false })
  @Expose()
  @IsOptional()
  course?: {
    id: string;
    title: string;
    slug: string;
  };

  constructor(partial: Partial<ChapterDto>) {
    Object.assign(this, partial);
  }
}
