import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { AuditElementsController } from './controllers/audit-elements.controller';
import { AuditClausesController } from './controllers/audit-clauses.controller';
import { AuditCriteriaController } from './controllers/audit-criteria.controller';
import { AuditElementsService } from './services/audit-elements.service';
import { AuditClausesService } from './services/audit-clauses.service';
import { AuditCriteriaService } from './services/audit-criteria.service';

@Module({
  imports: [SharedModule],
  controllers: [
    AuditElementsController,
    AuditClausesController,
    AuditCriteriaController,
  ],
  providers: [
    AuditElementsService,
    AuditClausesService,
    AuditCriteriaService,
  ],
  exports: [
    AuditElementsService,
    AuditClausesService,
    AuditCriteriaService,
  ],
})
export class MasterAuditPolicyModule {}
