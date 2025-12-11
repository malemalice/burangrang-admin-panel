import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CloseWorkPermitDto {
  @ApiProperty({ description: 'Closing notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
