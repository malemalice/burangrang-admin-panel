import { RouteConfig } from '@/core/routes/types';
import { lazy } from 'react';

const HealthQuizzesPage = lazy(() => import('../pages/HealthQuizzesPage'));
const CreateHealthQuizPage = lazy(() => import('../pages/CreateHealthQuizPage'));
const EditHealthQuizPage = lazy(() => import('../pages/EditHealthQuizPage'));
const HealthQuizDetailPage = lazy(() => import('../pages/HealthQuizDetailPage'));

const healthQuizRoutes: RouteConfig[] = [
  { path: '/health-quizzes', component: HealthQuizzesPage },
  { path: '/health-quizzes/new', component: CreateHealthQuizPage },
  { path: '/health-quizzes/:id/edit', component: EditHealthQuizPage },
  { path: '/health-quizzes/:id', component: HealthQuizDetailPage },
];

export default healthQuizRoutes;
