/**
 * Audit Criteria module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as AuditCriteriaPage } from './pages/AuditCriteriaPage';

// Routes
export { default as auditCriteriaRoutes } from './routes/auditCriteriaRoutes';

// Services
export { default as auditCriteriaService } from './services/auditCriteriaService';

// Types
export type {
  AuditCriteria,
  AuditCriteriaDTO,
  CreateAuditCriteriaDTO,
  UpdateAuditCriteriaDTO,
  AuditCriteriaFilters,
  AuditCriteriaSearchParams,
  PaginatedResponse,
  PaginationParams,
} from './types/audit-criteria.types';
