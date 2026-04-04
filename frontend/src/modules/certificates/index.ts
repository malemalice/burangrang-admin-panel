/**
 * Certificates module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as CertificatesPage } from './pages/CertificatesPage';
export { default as CertificateForm } from './pages/CertificateForm';
export { default as CertificateDetailPage } from './pages/CertificateDetailPage';
export { default as CertificateCategoriesPage } from './pages/CertificateCategoriesPage';
export { default as CertificateCategoryForm } from './pages/CertificateCategoryForm';
export { default as CreateCertificateCategoryPage } from './pages/CreateCertificateCategoryPage';
export { default as EditCertificateCategoryPage } from './pages/EditCertificateCategoryPage';
export { default as CertificateCategoryDetailPage } from './pages/CertificateCategoryDetailPage';

// Services
export { default as certificateService } from './services/certificateService';
export { default as certificateCategoryService } from './services/certificateCategoryService';

// Hooks
export {
    useCertificates,
    useCertificate,
    useCertificateCategories,
    useCertificateRenewals,
    useCertificateReminders,
} from './hooks/useCertificates';

// Types - Explicit type exports
export type {
    // Core types
    Certificate,
    CertificateCategory,
    CertificateRenewal,
    CertificateReminder,
    PaginatedResponse,
    PaginationParams,

    // DTO types
    CertificateDTO,
    CertificateCategoryDTO,
    CertificateRenewalDTO,
    CertificateReminderDTO,

    // Create/Update DTOs
    CreateCertificateDTO,
    UpdateCertificateDTO,
    CreateCertificateCategoryDTO,
    UpdateCertificateCategoryDTO,
    CreateCertificateRenewalDTO,
    UpdateCertificateRenewalDTO,

    // Form and UI types
    CertificateFormData,
    CertificateFilters,
    CertificateSearchParams,

    // Enum types
    CertificateType,
    CertificateRenewalStatus,
} from './types/certificate.types';

// Routes
export { default as certificateRoutes } from './routes/certificateRoutes';

