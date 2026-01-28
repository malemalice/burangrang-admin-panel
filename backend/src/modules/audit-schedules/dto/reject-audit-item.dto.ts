import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectAuditItemDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Insufficient evidence provided for corrective actions',
  })
  @IsString()
  @IsNotEmpty()
  notes: string;
}