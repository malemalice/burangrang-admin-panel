import { PartialType } from '@nestjs/swagger';
import { CreateDispatchOrderDto } from './create-dispatch-order.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { DispatchOrderStatusEnum } from './dispatch-order-status.enum';

export class UpdateDispatchOrderDto extends PartialType(
  CreateDispatchOrderDto,
) {
  @ApiProperty({ required: false, enum: DispatchOrderStatusEnum })
  @IsEnum(DispatchOrderStatusEnum)
  @IsOptional()
  status?: DispatchOrderStatusEnum;
}
