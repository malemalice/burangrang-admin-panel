import { Module } from '@nestjs/common';
import { AuditPeriodsController } from './controllers/audit-periods.controller';
import { AuditPeriodsService } from './services/audit-periods.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [AuditPeriodsController],
  providers: [AuditPeriodsService],
  exports: [AuditPeriodsService],
})
export class AuditPeriodsModule {}
