import { Module } from '@nestjs/common';
import { RiskMitigationsService } from './risk-mitigations.service';
import { RiskMitigationsController } from './risk-mitigations.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RiskMitigationsController],
  providers: [RiskMitigationsService],
  exports: [RiskMitigationsService],
})
export class RiskMitigationsModule {}
