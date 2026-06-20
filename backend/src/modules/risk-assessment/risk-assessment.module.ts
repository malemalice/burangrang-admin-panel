import { Module } from '@nestjs/common';
import { ApprovalsModule } from '../approvals/approvals.module';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';
import { RemindersModule } from '../reminders/reminders.module';
import { APPROVAL_ENTITIES } from '../../shared/constants/approval-entities';
import { RiskAssessmentController } from './controllers/risk-assessment.controller';
import { RiskAssessmentService } from './services/risk-assessment.service';

/**
 * Approval entity name for Risk Assessment module
 * Use this constant when calling approval-related methods
 */
export const RISK_ASSESSMENT_APPROVAL_ENTITY =
  APPROVAL_ENTITIES.RISK_ASSESSMENT;

@Module({
  imports: [
    RemindersModule,
    ApprovalsModule,
    MasterApprovalsModule,
  ],
  controllers: [RiskAssessmentController],
  providers: [RiskAssessmentService],
  exports: [RiskAssessmentService],
})
export class RiskAssessmentModule { }
