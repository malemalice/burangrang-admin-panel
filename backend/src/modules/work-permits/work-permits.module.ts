import { Module } from '@nestjs/common';
import { WorkPermitsService } from './work-permits.service';
import { WorkPermitsController } from './work-permits.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { APPROVAL_ENTITIES } from '../../shared/constants/approval-entities';

/**
 * Approval entity name for Work Permit module
 * Use this constant when calling approval-related methods
 */
export const WORK_PERMIT_APPROVAL_ENTITY = APPROVAL_ENTITIES.WORK_PERMIT;

@Module({
  imports: [PrismaModule, SharedModule, MasterApprovalsModule, NotificationsModule],
  controllers: [WorkPermitsController],
  providers: [WorkPermitsService],
  exports: [WorkPermitsService],
})
export class WorkPermitsModule { }
