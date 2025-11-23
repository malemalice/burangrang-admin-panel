import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsDate, IsBoolean } from 'class-validator';

export enum ReminderStatusEnum {
  PENDING = 'PENDING',
  SENT = 'SENT',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum ReminderRepeatTypeEnum {
  NONE = 'NONE',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class ReminderDto {
  @ApiProperty({ description: 'Reminder unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'User ID who owns this reminder' })
  @Expose()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Context/module name (e.g., t_incidents, t_audits)', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({ description: 'Entity primary key', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Reminder message content' })
  @Expose()
  @IsString()
  message: string;

  @ApiProperty({ description: 'When to trigger the reminder' })
  @Expose()
  @IsDate()
  remindAt: Date;

  @ApiProperty({ 
    description: 'Repeat type for recurring reminders',
    enum: ReminderRepeatTypeEnum,
    required: false 
  })
  @Expose()
  @IsOptional()
  @IsEnum(ReminderRepeatTypeEnum)
  repeatType?: ReminderRepeatTypeEnum;

  @ApiProperty({ description: 'When to stop repeating', required: false })
  @Expose()
  @IsOptional()
  @IsDate()
  repeatUntil?: Date;

  @ApiProperty({ 
    description: 'Current status of the reminder',
    enum: ReminderStatusEnum 
  })
  @Expose()
  @IsEnum(ReminderStatusEnum)
  status: ReminderStatusEnum;

  @ApiProperty({ description: 'Last time reminder was sent', required: false })
  @Expose()
  @IsOptional()
  @IsDate()
  lastSentAt?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  @IsDate()
  updatedAt: Date;

  constructor(partial: Partial<ReminderDto>) {
    Object.assign(this, partial);
  }
}

export class ReminderLogDto {
  @ApiProperty({ description: 'Log unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Reminder ID' })
  @Expose()
  @IsString()
  reminderId: string;

  @ApiProperty({ description: 'Execution status (SUCCESS, FAILED)' })
  @Expose()
  @IsString()
  executionStatus: string;

  @ApiProperty({ description: 'Execution duration in milliseconds', required: false })
  @Expose()
  @IsOptional()
  executionDuration?: number;

  @ApiProperty({ description: 'Failure reason if execution failed', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  failureReason?: string;

  @ApiProperty({ description: 'Created notification ID', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  notificationId?: string;

  @ApiProperty({ description: 'Whether email was sent successfully' })
  @Expose()
  @IsBoolean()
  emailSent: boolean;

  @ApiProperty({ description: 'Email sending error message', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  emailError?: string;

  @ApiProperty({ description: 'Execution timestamp' })
  @Expose()
  @IsDate()
  executedAt: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  @IsDate()
  createdAt: Date;

  constructor(partial: Partial<ReminderLogDto>) {
    Object.assign(this, partial);
  }
}

