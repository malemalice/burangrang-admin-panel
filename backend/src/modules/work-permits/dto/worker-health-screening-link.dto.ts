import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class WorkerHealthScreeningLinkDto {
  @ApiProperty({
    description: 'User id of the worker on this permit (`WorkPermitWorker.userId`)',
  })
  @IsUUID()
  userId: string;
}
