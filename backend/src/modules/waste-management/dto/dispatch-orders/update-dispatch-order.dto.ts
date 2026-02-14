import { PartialType } from '@nestjs/swagger';
import { CreateDispatchOrderDto } from './create-dispatch-order.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

export enum GeneralStatusEnum {
  SCHEDULED = 'SCHEDULED',
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  DONE = 'DONE',
  REJECTED = 'REJECTED',
}

export class UpdateDispatchOrderDto extends PartialType(
  CreateDispatchOrderDto,
) {
  @ApiProperty({ required: false, enum: GeneralStatusEnum })
  @IsEnum(GeneralStatusEnum)
  @IsOptional()
  status?: GeneralStatusEnum;
}
