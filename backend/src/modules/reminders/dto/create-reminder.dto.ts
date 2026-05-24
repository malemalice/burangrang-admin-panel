import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  IsBoolean,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ReminderRepeatTypeEnum, ReminderTargetTypeEnum } from './reminder.dto';

export class CreateReminderDto {
  @ApiProperty({ 
    description: 'Target type - who receives this reminder (USER, ROLE, DEPARTMENT, OFFICE)',
    enum: ReminderTargetTypeEnum,
    example: ReminderTargetTypeEnum.USER,
    required: false,
    default: ReminderTargetTypeEnum.USER
  })
  @IsOptional()
  @IsEnum(ReminderTargetTypeEnum)
  targetType?: ReminderTargetTypeEnum;

  @ApiProperty({ 
    description: 'Target ID - userId, roleId, departmentId, or officeId based on targetType',
    example: 'uuid-of-user-role-department-or-office',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  targetId: string;

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

  @ApiProperty({
    description:
      'Subject type — what the reminder is about, independent of which workflow it drives. ' +
      'E.g. "treatment-plant" when reminder is for a plant\'s monthly flow report.',
    example: 'treatment-plant',
    required: false,
  })
  @IsOptional()
  @IsString()
  subjectType?: string;

  @ApiProperty({
    description: 'Subject primary key (e.g. the treatment plant id).',
    example: 'uuid-of-treatment-plant',
    required: false,
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({
    description:
      'For MONTHLY recurrence: day of month (1..31). Falls back to last day of month when target ' +
      'day does not exist (e.g. day 31 in February).',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiProperty({
    description: 'For WEEKLY recurrence: day of week (0..6, Sunday=0).',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiProperty({
    description:
      'Allow remindAt in the past. Only set this for module-seeded or migration use cases — ' +
      'normal UI creates always validate future-only.',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowPast?: boolean;
}

