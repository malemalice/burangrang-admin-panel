import { PartialType } from '@nestjs/swagger';
import { CreateMasterApprovalDto } from './create-master-approval.dto';

export class UpdateMasterApprovalDto extends PartialType(CreateMasterApprovalDto) {} 