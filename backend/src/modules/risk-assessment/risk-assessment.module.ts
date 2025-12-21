import { Module } from '@nestjs/common';
import { RiskAssessmentController } from './controllers/risk-assessment.controller';
import { RiskAssessmentService } from './services/risk-assessment.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [RemindersModule],
  controllers: [RiskAssessmentController],
  providers: [RiskAssessmentService, ApprovalsService],
  exports: [RiskAssessmentService],
})
export class RiskAssessmentModule {} 