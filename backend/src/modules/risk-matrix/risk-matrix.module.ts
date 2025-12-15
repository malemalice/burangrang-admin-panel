import { Module } from '@nestjs/common';
import { RiskMatrixController } from './controllers/risk-matrix.controller';
import { RiskMatrixService } from './services/risk-matrix.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [RiskMatrixController],
  providers: [RiskMatrixService],
  exports: [RiskMatrixService],
})
export class RiskMatrixModule {} 