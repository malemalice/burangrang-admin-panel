import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { FindAllQueryDto } from '../../../shared/types/pagination-params';
import { ReminderStatusEnum } from './reminder.dto';

export class FindRemindersDto extends FindAllQueryDto {
  @ApiProperty({ 
    description: 'Filter by reminder status',
    enum: ReminderStatusEnum,
    required: false 
  })
  @IsOptional()
  @IsEnum(ReminderStatusEnum)
  status?: ReminderStatusEnum;

  @ApiProperty({ 
    description: 'Filter by entity/context',
    example: 't_incidents',
    required: false 
  })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({ 
    description: 'Filter by entity ID',
    example: 'uuid-of-entity',
    required: false 
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ 
    description: 'Filter reminders from date (ISO 8601 format)',
    example: '2025-11-01T00:00:00Z',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ 
    description: 'Filter reminders to date (ISO 8601 format)',
    example: '2025-12-31T23:59:59Z',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

