/**
 * Audit Criteria module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as AuditCriteriaPage } from './pages/AuditCriteriaPage';
export { default as CreateAuditCriteriaPage } from './pages/CreateAuditCriteriaPage';
export { default as EditAuditCriteriaPage } from './pages/EditAuditCriteriaPage';
export { default as AuditCriteriaDetailPage } from './pages/AuditCriteriaDetailPage';
export { default as AuditCriteriaForm } from './pages/AuditCriteriaForm';

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

// Constants
export {
  TRANSITION_TYPES,
  TRANSITION_TYPE_LABELS,
  TRANSITION_TYPE_OPTIONS,
  type TransitionType,
} from './constants/audit-criteria.constants';
