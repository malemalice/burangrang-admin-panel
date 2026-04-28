import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { RemindersScheduler } from './reminders.scheduler';
import { SharedModule } from '../../shared/shared.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HealthScreeningsModule } from '../health-screenings/health-screenings.module';

@Module({
  imports: [
    SharedModule,
    NotificationsModule,
    HealthScreeningsModule,
    ScheduleModule.forRoot(), // Enable scheduling for this module
  ],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersScheduler],
  exports: [RemindersService],
})
export class RemindersModule {}

