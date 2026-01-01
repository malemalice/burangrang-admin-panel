import { PartialType } from '@nestjs/mapped-types';
import { CreateInspectionInspectorDto } from './create-inspection-inspector.dto';

export class UpdateInspectionInspectorDto extends PartialType(
  CreateInspectionInspectorDto,
) {}

