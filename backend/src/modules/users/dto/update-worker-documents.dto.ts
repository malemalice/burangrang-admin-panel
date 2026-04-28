import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkerDocumentsDto {
  @ApiPropertyOptional({
    description:
      'Certificate file URL stored on the worker profile (`t_worker`). Send empty string to clear.',
    nullable: true,
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  certificateUrl?: string | null;
}
