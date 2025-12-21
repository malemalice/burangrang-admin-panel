import { Module } from '@nestjs/common';
import { EnvironmentalMeasurementsController } from './environmental-measurements.controller';
import { EnvironmentalMeasurementsService } from './environmental-measurements.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [EnvironmentalMeasurementsController],
  providers: [EnvironmentalMeasurementsService],
  exports: [EnvironmentalMeasurementsService],
})
export class EnvironmentalMeasurementsModule {}
