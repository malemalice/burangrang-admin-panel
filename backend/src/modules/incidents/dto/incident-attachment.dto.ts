import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class IncidentAttachmentDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  incidentId: string;

  @ApiProperty()
  @Expose()
  attachmentUrl: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  constructor(partial: Partial<IncidentAttachmentDto>) {
    Object.assign(this, partial);
  }
}
