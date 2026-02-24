import { Module } from '@nestjs/common';
import { PPEService } from './ppe.service';
import { PPEController } from './ppe.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, SharedModule, MasterApprovalsModule, NotificationsModule],
    controllers: [PPEController],
    providers: [PPEService],
    exports: [PPEService],
})
export class PPEModule { }

