import { PartialType } from '@nestjs/swagger';
import { CreateTreatmentPlantDto } from './create-treatment-plant.dto';

export class UpdateTreatmentPlantDto extends PartialType(CreateTreatmentPlantDto) {}
