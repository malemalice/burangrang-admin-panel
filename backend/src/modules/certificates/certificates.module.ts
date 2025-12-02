import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { SharedModule } from '../../shared/shared.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [SharedModule, RemindersModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule { }
