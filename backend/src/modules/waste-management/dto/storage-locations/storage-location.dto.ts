import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StorageLocationDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() name: string;
  @ApiProperty() @Expose() code: string;
  @ApiProperty() @Expose() location: string;
  @ApiProperty({ required: false }) @Expose() areaId?: string;
  @ApiProperty({ required: false }) @Expose() description?: string;
  @ApiProperty() @Expose() isActive: boolean;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;
  @ApiProperty() @Expose() createdBy: string;
  @ApiProperty({ required: false }) @Expose() area?: { id: string; name: string; code: string; };
  @ApiProperty({ required: false }) @Expose() creator?: { id: string; firstName: string; lastName: string; };

  constructor(partial: Partial<StorageLocationDto>) { Object.assign(this, partial); }
}
