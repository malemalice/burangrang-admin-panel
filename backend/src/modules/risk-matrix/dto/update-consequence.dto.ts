import { PartialType } from '@nestjs/swagger';
import { CreateConsequenceDto } from './create-consequence.dto';

export class UpdateConsequenceDto extends PartialType(CreateConsequenceDto) {}
