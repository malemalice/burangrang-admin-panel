import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateReminderDto } from './create-reminder.dto';
import { ReminderStatusEnum } from './reminder.dto';

export class UpdateReminderDto extends PartialType(CreateReminderDto) {
  @ApiProperty({ 
    description: 'Reminder status',
    enum: ReminderStatusEnum,
    required: false 
  })
  @IsOptional()
  @IsEnum(ReminderStatusEnum)
  status?: ReminderStatusEnum;
}

