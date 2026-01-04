import { PartialType } from '@nestjs/swagger';
import { CreateAuditClauseDto } from './create-audit-clause.dto';

export class UpdateAuditClauseDto extends PartialType(CreateAuditClauseDto) {}
