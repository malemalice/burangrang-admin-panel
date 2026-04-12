import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const EnrollmentsPage = lazy(() => import('../pages/EnrollmentsPage'));
const EnrollmentDetailPage = lazy(() => import('../pages/EnrollmentDetailPage'));
const EditEnrollmentPage = lazy(() => import('../pages/EditEnrollmentPage'));

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
