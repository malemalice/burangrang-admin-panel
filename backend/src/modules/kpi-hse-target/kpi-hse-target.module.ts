import { Module } from '@nestjs/common';
import { KpiHseTargetController } from './kpi-hse-target.controller';
import { KpiHseTargetService } from './kpi-hse-target.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [KpiHseTargetController],
  providers: [KpiHseTargetService],
  exports: [KpiHseTargetService],
})
export class KpiHseTargetModule {}
