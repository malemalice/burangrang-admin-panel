import { PartialType } from '@nestjs/swagger';
import { CreateRiskCategoryDto } from './create-risk-category.dto';

export class UpdateRiskCategoryDto extends PartialType(CreateRiskCategoryDto) {} 