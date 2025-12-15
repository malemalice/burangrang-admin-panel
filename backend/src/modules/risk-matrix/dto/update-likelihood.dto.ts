import { PartialType } from '@nestjs/swagger';
import { CreateLikelihoodDto } from './create-likelihood.dto';

export class UpdateLikelihoodDto extends PartialType(CreateLikelihoodDto) {}
