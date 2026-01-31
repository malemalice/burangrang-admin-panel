import { RouteConfig } from '@/core/routes/types';
import { lazy } from 'react';

// Lazy load course pages for better performance
const CoursesPage = lazy(() => import('../pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('../pages/CourseDetailPage'));
const CourseQuizManagePage = lazy(() => import('../pages/CourseQuizManagePage'));
const CoursePlayerPage = lazy(() => import('../pages/CoursePlayerPage'));

// Lazy load wrapper components for forms that need props
const CreateCourseForm = lazy(() => import('../components/CreateCourseForm'));
const EditCourseForm = lazy(() => import('../components/EditCourseForm'));
const CreateChapterForm = lazy(() => import('../components/CreateChapterForm'));
const EditChapterForm = lazy(() => import('../components/EditChapterForm'));

/**
 * Course management module routes
 */
const courseRoutes: RouteConfig[] = [
  {
    path: '/courses',
    component: CoursesPage,
  },
  {
    path: '/courses/new',
    component: CreateCourseForm,
  },
  {
    path: '/courses/:courseId',
    component: CourseDetailPage,
  },
  {
    path: '/courses/:courseId/learn',
    component: CoursePlayerPage,
  },
  {
    path: '/courses/:courseId/edit',
    component: EditCourseForm,
  },
  {
    path: '/courses/:courseId/quizzes/manage',
    component: CourseQuizManagePage,
  },
  {
    path: '/courses/:courseId/chapters/new',
    component: CreateChapterForm,
  },
  {
    path: '/courses/:courseId/chapters/:chapterId/edit',
    component: EditChapterForm,
  },
];

export default courseRoutes;
