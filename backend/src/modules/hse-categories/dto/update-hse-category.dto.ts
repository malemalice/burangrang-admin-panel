import { PartialType } from '@nestjs/swagger';
import { CreateHseCategoryDto } from './create-hse-category.dto';

export class UpdateHseCategoryDto extends PartialType(CreateHseCategoryDto) {} 