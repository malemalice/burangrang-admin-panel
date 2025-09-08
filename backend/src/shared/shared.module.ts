import { Module } from '@nestjs/common';
import { ErrorHandlingService } from './services/error-handling.service';
import { SettingsService } from './services/settings.service';

@Module({
  providers: [ErrorHandlingService, SettingsService],
  exports: [ErrorHandlingService, SettingsService],
})
export class SharedModule {}
