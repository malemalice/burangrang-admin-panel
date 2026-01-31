import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditScheduleDto } from './create-audit-schedule.dto';

export class UpdateAuditScheduleDto extends PartialType(CreateAuditScheduleDto) {}
