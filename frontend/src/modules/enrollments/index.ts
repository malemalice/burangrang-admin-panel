/**
 * Enrollment module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as EnrollmentsPage } from './pages/EnrollmentsPage';
export { default as EnrollmentDetailPage } from './pages/EnrollmentDetailPage';
export { default as EditEnrollmentPage } from './pages/EditEnrollmentPage';

// Routes
export { default as enrollmentRoutes } from './routes/enrollmentRoutes';

// Services
export { default as enrollmentService } from './services/enrollmentService';

// Types
export type {
  Enrollment,
  EnrollmentDTO,
  AssignEnrollmentDTO,
  UpdateEnrollmentDTO,
  CreateEnrollmentDTO,
  EnrollmentSearchParams,
  PaginatedResponse,
  EnrollmentStatus,
} from './types/enrollment.types';

// Hooks
export {
  useEnrollments,
  useEnrollment,
  useUserEnrollments,
} from './hooks/useEnrollments';

// Components
export { default as AssignCourseDialog } from './components/AssignCourseDialog';
