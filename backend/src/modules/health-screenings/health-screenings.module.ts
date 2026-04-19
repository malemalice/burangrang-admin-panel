import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { SettingsModule } from '../settings/settings.module';
import { HealthScreeningsController } from './health-screenings.controller';
import { HealthScreeningsService } from './health-screenings.service';

@Module({
  imports: [SharedModule, QuizzesModule, SettingsModule],
  controllers: [HealthScreeningsController],
  providers: [HealthScreeningsService],
  exports: [HealthScreeningsService],
})
export class HealthScreeningsModule {}
