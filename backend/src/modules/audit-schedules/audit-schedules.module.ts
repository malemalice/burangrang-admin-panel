import { Module } from '@nestjs/common';
import { AuditSchedulesController } from './controllers/audit-schedules.controller';
import { AuditSchedulesService } from './services/audit-schedules.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [PrismaModule, SharedModule, RemindersModule],
  controllers: [AuditSchedulesController],
  providers: [AuditSchedulesService],
  exports: [AuditSchedulesService],
})
export class AuditSchedulesModule {}
