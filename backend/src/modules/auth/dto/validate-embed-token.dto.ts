import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateEmbedTokenRequestDto {
  @ApiProperty({
    description: 'Embed token from URL query parameter',
    example: 'eyJzaXRlSWQiOiJoc2UtZ29vZ2xlLXNpdGUifQ.abc123...',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  embedToken: string;
}

export class ValidateEmbedTokenResponseDto {
  @ApiProperty({
    description: 'Whether the embed token is valid',
    example: true,
  })
  @Expose()
  valid: boolean;

  constructor(partial: Partial<ValidateEmbedTokenResponseDto>) {
    Object.assign(this, partial);
  }
}
