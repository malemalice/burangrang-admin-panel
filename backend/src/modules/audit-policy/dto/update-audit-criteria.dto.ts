import { PartialType } from '@nestjs/swagger';
import { CreateAuditCriteriaDto } from './create-audit-criteria.dto';

export class UpdateAuditCriteriaDto extends PartialType(CreateAuditCriteriaDto) {}
