import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubmitWorkPermitDto {
  @ApiProperty({ description: 'Additional notes when submitting', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
