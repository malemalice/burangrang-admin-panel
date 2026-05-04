import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserDto } from 'src/modules/users/dto/user.dto';
import { AuditScheduleDto } from 'src/modules/audit-schedules/dto/audit-schedule.dto';

export class AuditPeriodDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Month number (1–12)' })
  @Expose()
  month: number;

  @ApiProperty({ description: 'Year (e.g. 2026)' })
  @Expose()
  year: number;

  @ApiProperty({ required: false })
  @Expose()
  notes?: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  createdBy: string;

  @ApiProperty({ type: UserDto })
  @Expose()
  creator: UserDto;

  @ApiProperty({ type: [AuditScheduleDto], required: false })
  @Expose()
  audits?: AuditScheduleDto[];

  @ApiProperty({ description: 'Total number of audits in this period' })
  @Expose()
  totalAudits: number;

  @ApiProperty({ description: 'Number of audits that are fully completed' })
  @Expose()
  completedAudits: number;

  constructor(partial: Partial<AuditPeriodDto>) {
    Object.assign(this, partial);
  }
}
