import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WasteSourceDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() name: string;
  @ApiProperty() @Expose() code: string;
  @ApiProperty() @Expose() sourceType: string;
  @ApiProperty({ required: false }) @Expose() description?: string;
  @ApiProperty({ required: false }) @Expose() contactPerson?: string;
  @ApiProperty({ required: false }) @Expose() phone?: string;
  @ApiProperty({ required: false }) @Expose() email?: string;
  @ApiProperty() @Expose() isActive: boolean;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;

  constructor(partial: Partial<WasteSourceDto>) {
    Object.assign(this, partial);
  }
}
