import { PartialType } from '@nestjs/mapped-types';
import { CreateInspectionImageDto } from './create-inspection-image.dto';

export class UpdateInspectionImageDto extends PartialType(
  CreateInspectionImageDto,
) {}

