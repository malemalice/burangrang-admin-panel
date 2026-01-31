import { Module } from '@nestjs/common';
import { IncidentsController } from './controllers/incidents.controller';
import { IncidentsService } from './services/incidents.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, SharedModule, MasterApprovalsModule, NotificationsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
