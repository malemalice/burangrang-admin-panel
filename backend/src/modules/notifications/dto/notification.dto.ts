import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean, IsDateString } from 'class-validator';
import { Expose } from 'class-transformer';

export class NotificationTypeDto {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createdAt: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  updatedAt: string;

  constructor(partial: Partial<NotificationTypeDto>) {
    Object.assign(this, partial);
  }
}

export class NotificationRecipientDto {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  notificationId: string;

  @ApiProperty()
  @Expose()
  @IsString()
  roleId: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isRead: boolean;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  readAt?: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createdAt: string;

  constructor(partial: Partial<NotificationRecipientDto>) {
    Object.assign(this, partial);
  }
}

export class NotificationDto {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  title: string;

  @ApiProperty()
  @Expose()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  context?: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsString()
  contextId?: string;

  @ApiProperty()
  @Expose()
  @IsString()
  typeId: string;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isRead: boolean;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createdAt: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  updatedAt: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  readAt?: string;

  // Relations
  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  type?: NotificationTypeDto;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  recipients?: NotificationRecipientDto[];

  @ApiProperty()
  @Expose()
  @IsString()
  createdBy: string;

  constructor(partial: Partial<NotificationDto>) {
    Object.assign(this, partial);
  }
}
