import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class ZohoWebhookDto {
  @ApiProperty({
    description: 'Zoho event data',
    type: Object,
    additionalProperties: true,
  })
  @IsObject()
  data: Record<string, unknown>;

  @ApiProperty({
    required: false,
    description: 'Additional metadata',
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
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
