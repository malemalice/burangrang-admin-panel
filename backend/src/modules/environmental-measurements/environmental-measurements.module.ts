import { Module } from '@nestjs/common';
import { EnvironmentalMeasurementsController } from './environmental-measurements.controller';
import { EnvironmentalMeasurementsService } from './environmental-measurements.service';
import { SharedModule } from '../../shared/shared.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SharedModule, SettingsModule],
  controllers: [EnvironmentalMeasurementsController],
  providers: [EnvironmentalMeasurementsService],
  exports: [EnvironmentalMeasurementsService],
})
export class EnvironmentalMeasurementsModule {}
