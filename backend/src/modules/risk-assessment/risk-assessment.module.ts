import { Module } from '@nestjs/common';
import { RiskAssessmentController } from './controllers/risk-assessment.controller';
import { RiskAssessmentService } from './services/risk-assessment.service';
import { ApprovalsModule } from '../approvals/approvals.module';
import { RemindersModule } from '../reminders/reminders.module';
import { APPROVAL_ENTITIES } from '../../shared/constants/approval-entities';

/**
 * Approval entity name for Risk Assessment module
 * Use this constant when calling approval-related methods
 */
export const RISK_ASSESSMENT_APPROVAL_ENTITY =
  APPROVAL_ENTITIES.RISK_ASSESSMENT;

@Module({
  imports: [RemindersModule, ApprovalsModule],
  controllers: [RiskAssessmentController],
  providers: [RiskAssessmentService],
  exports: [RiskAssessmentService],
})
export class RiskAssessmentModule {}
