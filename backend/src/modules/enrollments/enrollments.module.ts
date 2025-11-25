import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { SharedModule } from '../../shared/shared.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SharedModule, NotificationsModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule { }
