import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class RequestInfoWorkPermitDto {
  @ApiProperty({ description: 'Information request message (required)' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'CC user IDs (for project users)', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccUserIds?: string[];

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
