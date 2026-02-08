import { PartialType } from '@nestjs/swagger';
import { CreateWaterQualityParameterDto } from './create-water-quality-parameter.dto';

export class UpdateWaterQualityParameterDto extends PartialType(
  CreateWaterQualityParameterDto,
) {}
