import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { ReminderTargetTypeEnum } from './reminder.dto';

export enum ReminderOccurrenceStateEnum {
  SCHEDULED = 'SCHEDULED',
  FIRED = 'FIRED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  DISMISSED = 'DISMISSED',
  MISSED = 'MISSED',
  FAILED = 'FAILED',
}

/**
 * Denormalised view of a reminder occurrence — carries enough of the parent reminder
 * (entity, subject, target, message) so the calendar and notifications can render and
 * deep-link without an extra round-trip.
 */
export class ReminderOccurrenceDto {
  @ApiProperty({ description: 'Occurrence id' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Parent reminder id' })
  @Expose()
  @IsString()
  reminderId: string;

  @ApiProperty({ description: 'When this occurrence is scheduled to fire' })
  @Expose()
  @IsDate()
  scheduledAt: Date;

  @ApiProperty({ description: 'When the scheduler actually fired it', required: false })
  @Expose()
  @IsOptional()
  @IsDate()
  firedAt?: Date;

  @ApiProperty({ enum: ReminderOccurrenceStateEnum })
  @Expose()
  @IsEnum(ReminderOccurrenceStateEnum)
  state: ReminderOccurrenceStateEnum;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  acknowledgedBy?: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsDate()
  acknowledgedAt?: Date;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  dismissedBy?: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsDate()
  dismissedAt?: Date;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  failureReason?: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  notificationId?: string;

  // Denormalised reminder fields for renderer convenience.
  @ApiProperty()
  @Expose()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  subjectType?: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ enum: ReminderTargetTypeEnum })
  @Expose()
  @IsEnum(ReminderTargetTypeEnum)
  targetType: ReminderTargetTypeEnum;

  @ApiProperty()
  @Expose()
  @IsString()
  targetId: string;

  constructor(partial: Partial<ReminderOccurrenceDto>) {
    Object.assign(this, partial);
  }
}
