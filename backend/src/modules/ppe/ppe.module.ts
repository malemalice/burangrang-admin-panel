import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PPEService } from './ppe.service';
import { PPEController } from './ppe.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { PpePdfService } from './ppe-pdf.service';

@Module({
    imports: [PrismaModule, SharedModule, MasterApprovalsModule, NotificationsModule, MailModule, ConfigModule],
    controllers: [PPEController],
    providers: [PPEService, PpePdfService],
    exports: [PPEService],
})
export class PPEModule { }

