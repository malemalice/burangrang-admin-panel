import { Module } from '@nestjs/common';
import { WorkPermitsService } from './work-permits.service';
import { WorkPermitsController } from './work-permits.controller';
import { WorkPermitsPublicController } from './work-permits-public.controller';
import { WorkClassificationsService } from './work-classifications.service';
import { WorkClassificationsController } from './work-classifications.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { APPROVAL_ENTITIES } from '../../shared/constants/approval-entities';
import { WorkPermitPublicLinkService } from './services/work-permit-public-link.service';

/**
 * Approval entity name for Work Permit module
 * Use this constant when calling approval-related methods
 */
export const WORK_PERMIT_APPROVAL_ENTITY = APPROVAL_ENTITIES.WORK_PERMIT;

@Module({
  imports: [
    PrismaModule,
    SharedModule,
    MasterApprovalsModule,
    NotificationsModule,
    SettingsModule,
  ],
  controllers: [
    WorkPermitsController,
    WorkPermitsPublicController,
    WorkClassificationsController,
  ],
  providers: [
    WorkPermitsService,
    WorkClassificationsService,
    WorkPermitPublicLinkService,
  ],
  exports: [WorkPermitsService],
})
export class WorkPermitsModule { }
