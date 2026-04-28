import { ApiProperty } from '@nestjs/swagger';

export class PublicWorkPermitLinkResponseDto {
  @ApiProperty()
  linkUrl: string;

  @ApiProperty({ description: 'ISO-8601 expiry of the link (24h from creation)' })
  expiresAt: string;

  @ApiProperty()
  workPermitId: string;
}

