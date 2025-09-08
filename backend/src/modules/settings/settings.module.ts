import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SettingsHelperService } from '../../shared/services/settings.service';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, SettingsHelperService, PrismaService],
  exports: [SettingsService, SettingsHelperService],
})
export class SettingsModule {}
