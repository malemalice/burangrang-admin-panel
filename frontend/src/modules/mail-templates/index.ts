/**
 * Mail Templates module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as EmailTemplatesPage } from './pages/EmailTemplatesPage';
export { default as CreateEmailTemplatePage } from './pages/CreateEmailTemplatePage';
export { default as EditEmailTemplatePage } from './pages/EditEmailTemplatePage';
export { default as EmailTemplateDetailPage } from './pages/EmailTemplateDetailPage';
export { default as EmailTemplateForm } from './pages/EmailTemplateForm';

// Routes
export { default as emailTemplateRoutes } from './routes/emailTemplateRoutes';

// Services
export { default as emailTemplateService } from './services/emailTemplateService';

// Types
export type {
  EmailTemplate,
  EmailTemplateDTO,
  CreateEmailTemplateDTO,
  UpdateEmailTemplateDTO,
  EmailTemplateFormData,
  EmailTemplateFilters,
  EmailTemplateSearchParams,
  PaginatedResponse,
  PaginationParams,
} from './types/email-template.types';

// Hooks
export { useEmailTemplates, useEmailTemplate } from './hooks/useEmailTemplates';


