import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, ValidateIf } from 'class-validator';
import { ReminderRepeatTypeEnum } from './reminder.dto';

export class CreateReminderDto {
  @ApiProperty({ 
    description: 'Context/module name (e.g., t_incidents, t_audits)',
    example: 't_incidents',
    required: false 
  })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({ 
    description: 'Entity primary key',
    example: 'uuid-of-incident',
    required: false 
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ 
    description: 'Reminder message content',
    example: 'Follow up on incident report submission' 
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ 
    description: 'When to trigger the reminder (ISO 8601 format)',
    example: '2025-11-30T10:00:00Z' 
  })
  @IsDateString()
  @IsNotEmpty()
  remindAt: string;

  @ApiProperty({ 
    description: 'Repeat type for recurring reminders',
    enum: ReminderRepeatTypeEnum,
    example: ReminderRepeatTypeEnum.NONE,
    required: false,
    default: ReminderRepeatTypeEnum.NONE
  })
  @IsOptional()
  @IsEnum(ReminderRepeatTypeEnum)
  repeatType?: ReminderRepeatTypeEnum;

  @ApiProperty({ 
    description: 'When to stop repeating (ISO 8601 format). Required if repeatType is not NONE',
    example: '2025-12-31T23:59:59Z',
    required: false 
  })
  @ValidateIf((o) => o.repeatType && o.repeatType !== ReminderRepeatTypeEnum.NONE)
  @IsDateString()
  repeatUntil?: string;
}

