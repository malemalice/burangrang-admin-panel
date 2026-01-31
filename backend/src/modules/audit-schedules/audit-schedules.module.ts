import { Module } from '@nestjs/common';
import { AuditSchedulesController } from './controllers/audit-schedules.controller';
import { AuditSchedulesService } from './services/audit-schedules.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { RemindersModule } from '../reminders/reminders.module';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [PrismaModule, SharedModule, RemindersModule, MasterApprovalsModule, ApprovalsModule],
  controllers: [AuditSchedulesController],
  providers: [AuditSchedulesService],
  exports: [AuditSchedulesService],
})
export class AuditSchedulesModule {}
