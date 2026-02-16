import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class GenerateEmbedTokenDto {
  @ApiPropertyOptional({
    description: 'Optional site identifier for tracking',
    example: 'hse-google-site',
  })
  @Expose()
  @IsOptional()
  @IsString()
  siteId?: string;
}
