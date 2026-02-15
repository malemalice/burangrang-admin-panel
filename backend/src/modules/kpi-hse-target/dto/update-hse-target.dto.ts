import { PartialType } from '@nestjs/swagger';
import { CreateHseTargetDto } from './create-hse-target.dto';

export class UpdateHseTargetDto extends PartialType(CreateHseTargetDto) {}
