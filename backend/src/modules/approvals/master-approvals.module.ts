import { Module } from '@nestjs/common';
import { MasterApprovalsService } from './master-approvals.service';
import { MasterApprovalsController } from './master-approvals.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import { SharedModule } from '../../shared/shared.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, SharedModule, NotificationsModule],
  controllers: [MasterApprovalsController],
  providers: [MasterApprovalsService, ConfigService],
  exports: [MasterApprovalsService],
})
export class MasterApprovalsModule {}
