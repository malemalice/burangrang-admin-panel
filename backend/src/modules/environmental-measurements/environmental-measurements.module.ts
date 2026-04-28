import { Module } from '@nestjs/common';
import { EnvironmentalMeasurementsController } from './environmental-measurements.controller';
import { EnvironmentalMeasurementsService } from './environmental-measurements.service';
import { SharedModule } from '../../shared/shared.module';
import { SettingsModule } from '../settings/settings.module';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';

@Module({
  imports: [SharedModule, SettingsModule, MasterApprovalsModule],
  controllers: [EnvironmentalMeasurementsController],
  providers: [EnvironmentalMeasurementsService],
  exports: [EnvironmentalMeasurementsService],
})
export class EnvironmentalMeasurementsModule {}
