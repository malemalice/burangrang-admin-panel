import { RouteConfig } from '@/core/routes/types';
import { lazy } from 'react';

// Lazy load quiz pages for better performance
const QuizzesPage = lazy(() => import('../pages/QuizzesPage'));
const CreateQuizPage = lazy(() => import('../pages/CreateQuizPage'));
const EditQuizPage = lazy(() => import('../pages/EditQuizPage'));
const QuizDetailPage = lazy(() => import('../pages/QuizDetailPage'));
const QuizAttemptPage = lazy(() => import('../pages/QuizAttemptPage'));

/**
 * Quiz management module routes
 */
const quizRoutes: RouteConfig[] = [
  {
    path: '/quizzes',
    component: QuizzesPage,
  },
  {
    path: '/quizzes/new',
    component: CreateQuizPage,
  },
  {
    path: '/quizzes/:id',
    component: QuizDetailPage,
  },
  {
    path: '/quizzes/:id/edit',
    component: EditQuizPage,
  },
  {
    path: '/quizzes/:id/attempt',
    component: QuizAttemptPage,
  },
];

export default quizRoutes;
