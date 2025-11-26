import { RouteConfig } from '@/core/routes/types';
import EnrollmentsPage from '../pages/EnrollmentsPage';
import EnrollmentDetailPage from '../pages/EnrollmentDetailPage';
import EditEnrollmentPage from '../pages/EditEnrollmentPage';

/**
 * Enrollment module routes
 */
const enrollmentRoutes: RouteConfig[] = [
  {
    path: '/enrollments',
    component: EnrollmentsPage,
  },
  {
    path: '/enrollments/:id',
    component: EnrollmentDetailPage,
  },
  {
    path: '/enrollments/:id/edit',
    component: EditEnrollmentPage,
  },
];

export default enrollmentRoutes;
