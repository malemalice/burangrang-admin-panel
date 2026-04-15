import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { WorkClassificationAttachmentItemDto } from './work-classification-attachment.dto';

export class WorkClassificationDto {
  @ApiProperty({ description: 'Unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Classification name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Classification code' })
  @Expose()
  code: string;

  @ApiPropertyOptional({ description: 'Description' })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ description: 'Safety guideline text' })
  @Expose()
  safetyGuideline?: string;

  @ApiProperty({ description: 'Active status' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Attached documents',
    type: [WorkClassificationAttachmentItemDto],
  })
  @Expose()
  @Type(() => WorkClassificationAttachmentItemDto)
  attachments?: WorkClassificationAttachmentItemDto[];

  constructor(partial: Partial<WorkClassificationDto>) {
    Object.assign(this, partial);
  }
}
