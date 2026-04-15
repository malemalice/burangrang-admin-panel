import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SignSkWorkPermitDto {
  @ApiProperty({
    description: 'Optional signature metadata/token captured from acknowledgment step',
    required: false,
  })
  @IsOptional()
  @IsString()
  signature?: string;
}
