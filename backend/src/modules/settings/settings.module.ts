import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SettingsHelperService } from '../../shared/services/settings.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsHelperService],
  exports: [SettingsService, SettingsHelperService],
})
export class SettingsModule {}
