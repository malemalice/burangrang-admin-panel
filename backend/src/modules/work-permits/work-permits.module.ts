import { Module } from '@nestjs/common';
import { WorkPermitsService } from './work-permits.service';
import { WorkPermitsController } from './work-permits.controller';
import { SharedModule } from '../../shared/shared.module';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SharedModule, MasterApprovalsModule, NotificationsModule],
  controllers: [WorkPermitsController],
  providers: [WorkPermitsService],
  exports: [WorkPermitsService],
})
export class WorkPermitsModule { }
