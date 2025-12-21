import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DispatchOrderDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() dispatchCode: string;
  @ApiProperty() @Expose() dispatchDate: Date;
  @ApiProperty() @Expose() orderedBy: string;
  @ApiProperty() @Expose() quantity: number;
  @ApiProperty({ required: false }) @Expose() memo?: string;
  @ApiProperty() @Expose() status: string;
  @ApiProperty() @Expose() isActive: boolean;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;
  @ApiProperty() @Expose() createdBy: string;
  @ApiProperty({ required: false }) @Expose() orderer?: { id: string; firstName: string; lastName: string; };
  @ApiProperty({ required: false }) @Expose() creator?: { id: string; firstName: string; lastName: string; };

  constructor(partial: Partial<DispatchOrderDto>) { Object.assign(this, partial); }
}
