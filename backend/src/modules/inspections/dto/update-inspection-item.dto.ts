import { PartialType } from '@nestjs/mapped-types';
import { CreateInspectionItemDto } from './create-inspection-item.dto';

export class UpdateInspectionItemDto extends PartialType(
  CreateInspectionItemDto,
) {}

