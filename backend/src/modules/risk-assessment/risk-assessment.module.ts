import { Module } from '@nestjs/common';
import { RiskAssessmentController } from './controllers/risk-assessment.controller';
import { RiskAssessmentService } from './services/risk-assessment.service';

@Module({
  controllers: [RiskAssessmentController],
  providers: [RiskAssessmentService],
  exports: [RiskAssessmentService],
})
export class RiskAssessmentModule {} 