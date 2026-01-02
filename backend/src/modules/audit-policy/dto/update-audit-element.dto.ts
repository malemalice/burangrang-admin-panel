import { PartialType } from '@nestjs/swagger';
import { CreateAuditElementDto } from './create-audit-element.dto';

export class UpdateAuditElementDto extends PartialType(CreateAuditElementDto) {}
