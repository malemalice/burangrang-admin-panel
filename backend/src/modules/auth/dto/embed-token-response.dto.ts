import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EmbedTokenResponseDto {
  @ApiProperty({
    description: 'Full embed URL with token for use in iframe or embed by URL',
    example: 'https://panel.example.com?embed_token=eyJzaXRlSWQiOi...',
  })
  @Expose()
  embedUrl: string;

  constructor(partial: Partial<EmbedTokenResponseDto>) {
    Object.assign(this, partial);
  }
}
