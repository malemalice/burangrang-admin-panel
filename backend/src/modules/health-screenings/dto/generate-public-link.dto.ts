import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GeneratePublicLinkDto {
  @ApiProperty({
    required: false,
    description: 'Worker profile id (`t_worker`) to start a declaration for',
  })
  @IsOptional()
  @IsUUID()
  workerId?: string;

  @ApiProperty({
    required: false,
    description:
      'Contractor user id — resolves `t_worker` when workerId is omitted (e.g. work-permit workers list)',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
