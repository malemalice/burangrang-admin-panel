import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsDate, IsBoolean, IsInt } from 'class-validator';

export enum ReminderStatusEnum {
  PENDING = 'PENDING',
  SENT = 'SENT',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum ReminderRepeatTypeEnum {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum ReminderTargetTypeEnum {
  USER = 'USER',
  ROLE = 'ROLE',
  DEPARTMENT = 'DEPARTMENT',
  OFFICE = 'OFFICE',
}

export class ReminderDto {
  @ApiProperty({ description: 'Reminder unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ 
    description: 'Target type - who receives this reminder',
    enum: ReminderTargetTypeEnum
  })
  @Expose()
  @IsEnum(ReminderTargetTypeEnum)
  targetType: ReminderTargetTypeEnum;

  @ApiProperty({ description: 'Target ID - userId, roleId, departmentId, or officeId' })
  @Expose()
  @IsString()
  targetId: string;

  @ApiProperty({ description: 'User ID who created this reminder' })
  @Expose()
  @IsString()
  createdBy: string;

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

  @ApiProperty({
    description: 'Subject type — what the reminder is about (e.g. "treatment-plant").',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()
  subjectType?: string;

  @ApiProperty({ description: 'Subject primary key.', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  subjectId?: string;

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
    description: 'MONTHLY: day of month (1..31), last-day fallback for short months.',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsInt()
  dayOfMonth?: number;

  @ApiProperty({ description: 'WEEKLY: day of week (0..6, Sunday=0).', required: false })
  @Expose()
  @IsOptional()
  @IsInt()
  dayOfWeek?: number;

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

  // Legacy field for backward compatibility (will be removed in future)
  @ApiProperty({ description: 'Legacy userId field - use targetId when targetType is USER', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  userId?: string;

  constructor(partial: Partial<ReminderDto>) {
    Object.assign(this, partial);
    // Backward compatibility: set userId from targetId when targetType is USER
    if (this.targetType === ReminderTargetTypeEnum.USER && this.targetId && !this.userId) {
      this.userId = this.targetId;
    }
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

