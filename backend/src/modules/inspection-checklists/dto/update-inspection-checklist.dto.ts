import { PartialType } from '@nestjs/swagger';
import { CreateInspectionChecklistDto } from './create-inspection-checklist.dto';

export class UpdateInspectionChecklistDto extends PartialType(CreateInspectionChecklistDto) {}
