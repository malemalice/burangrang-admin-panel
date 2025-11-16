import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { SettingsModule } from '../settings/settings.module';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [
    SharedModule, SettingsModule, PrismaModule,
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
