import { Module } from '@nestjs/common';
import { AuditPeriodsController } from './controllers/audit-periods.controller';
import { AuditPeriodsService } from './services/audit-periods.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { AuditSchedulesModule } from '../audit-schedules/audit-schedules.module';

@Module({
  imports: [PrismaModule, SharedModule, AuditSchedulesModule],
  controllers: [AuditPeriodsController],
  providers: [AuditPeriodsService],
  exports: [AuditPeriodsService],
})
export class AuditPeriodsModule {}
