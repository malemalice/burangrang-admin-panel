import { Module } from '@nestjs/common';
import { RiskMatrixController } from './controllers/risk-matrix.controller';
import { RiskMatrixService } from './services/risk-matrix.service';

@Module({
  controllers: [RiskMatrixController],
  providers: [RiskMatrixService],
  exports: [RiskMatrixService],
})
export class RiskMatrixModule {} 