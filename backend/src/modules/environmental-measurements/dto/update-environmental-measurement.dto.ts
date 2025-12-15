import { PartialType } from '@nestjs/swagger';
import { CreateEnvironmentalMeasurementDto } from './create-environmental-measurement.dto';

export class UpdateEnvironmentalMeasurementDto extends PartialType(CreateEnvironmentalMeasurementDto) {}
