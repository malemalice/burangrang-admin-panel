import { ApiProperty } from '@nestjs/swagger';

export class PublicHealthScreeningLinkResponseDto {
  @ApiProperty()
  linkUrl: string;

  @ApiProperty({ description: 'ISO-8601 expiry of the link (24h from creation)' })
  expiresAt: string;

  @ApiProperty()
  screeningId: string;
}
