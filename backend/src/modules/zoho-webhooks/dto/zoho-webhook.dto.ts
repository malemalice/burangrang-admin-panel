import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class ZohoWebhookDto {
  @ApiProperty({
    required: false,
    description: 'Zoho event data (direct payload format)',
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    description: 'Additional metadata (direct payload format)',
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    description:
      'Zoho SDP wrapped payload format. Contains { data, meta } under body',
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;
}

export class ZohoWebhookResponseDto {
  @ApiProperty({ description: 'Status of the webhook processing' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Response message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Correlation identifier for tracing' })
  @IsString()
  correlationId: string;
}
