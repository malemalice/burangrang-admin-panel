import { PartialType } from '@nestjs/swagger';
import { CreateHfacsNodeDto } from './create-hfacs-node.dto';

export class UpdateHfacsNodeDto extends PartialType(CreateHfacsNodeDto) {}
