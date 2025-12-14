import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WasteTypeDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() name: string;
  @ApiProperty() @Expose() code: string;
  @ApiProperty() @Expose() wasteType: string;
  @ApiProperty({ required: false }) @Expose() description?: string;
  @ApiProperty() @Expose() requiresSpecialHandling: boolean;
  @ApiProperty() @Expose() isActive: boolean;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;

  constructor(partial: Partial<WasteTypeDto>) {
    Object.assign(this, partial);
  }
}
