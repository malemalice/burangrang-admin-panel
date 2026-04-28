import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { RemindersModule } from '../reminders/reminders.module';
import { MailModule } from '../mail/mail.module';
import { CertificatesScheduler } from './certificates.scheduler';

@Module({
  imports: [PrismaModule, SharedModule, RemindersModule, MailModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificatesScheduler],
  exports: [CertificatesService],
})
export class CertificatesModule { }

