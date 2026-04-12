import { PartialType } from '@nestjs/swagger';
import { CreateWorkClassificationDto } from './create-work-classification.dto';

export class UpdateWorkClassificationDto extends PartialType(CreateWorkClassificationDto) {}
