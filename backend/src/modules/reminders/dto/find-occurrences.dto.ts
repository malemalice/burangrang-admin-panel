import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { ReminderOccurrenceStateEnum } from './occurrence.dto';

export type OccurrenceScope = 'mine' | 'all';

export class FindOccurrencesDto {
  @ApiProperty({ description: 'Range start (ISO 8601, inclusive)' })
  @IsDateString()
  from: string;

  @ApiProperty({ description: 'Range end (ISO 8601, inclusive)' })
  @IsDateString()
  to: string;

  @ApiProperty({
    description:
      '"mine" = creator or targeted at me (default); "all" = all reminders the user can see ' +
      '(currently identical to "mine" — reserved for future admin views).',
    required: false,
    enum: ['mine', 'all'],
    default: 'mine',
  })
  @IsOptional()
  @IsIn(['mine', 'all'])
  scope?: OccurrenceScope;

  @ApiProperty({ description: 'Filter by entity/module', required: false })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({ description: 'Filter by subject type', required: false })
  @IsOptional()
  @IsString()
  subjectType?: string;

  @ApiProperty({ description: 'Filter by subject id', required: false })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ description: 'Filter by reminder id', required: false })
  @IsOptional()
  @IsString()
  reminderId?: string;

  @ApiProperty({ enum: ReminderOccurrenceStateEnum, required: false })
  @IsOptional()
  @IsEnum(ReminderOccurrenceStateEnum)
  state?: ReminderOccurrenceStateEnum;
}
