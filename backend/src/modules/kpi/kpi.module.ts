import { Module } from '@nestjs/common';
import { KpiController } from './controllers/kpi.controller';
import { KpiService } from './services/kpi.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KpiController],
  providers: [KpiService],
  exports: [KpiService],
})
export class KpiModule {}
