import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const EmailTemplatesPage = lazy(() => import('../pages/EmailTemplatesPage'));
const CreateEmailTemplatePage = lazy(() => import('../pages/CreateEmailTemplatePage'));
const EditEmailTemplatePage = lazy(() => import('../pages/EditEmailTemplatePage'));
const EmailTemplateDetailPage = lazy(() => import('../pages/EmailTemplateDetailPage'));

/**
 * Email templates management module routes
 */
const emailTemplateRoutes: RouteConfig[] = [
  {
    path: '/mail-templates',
    component: EmailTemplatesPage,
  },
  {
    path: '/mail-templates/new',
    component: CreateEmailTemplatePage,
  },
  {
    path: '/mail-templates/:templateId',
    component: EmailTemplateDetailPage,
  },
  {
    path: '/mail-templates/:templateId/edit',
    component: EditEmailTemplatePage,
  },
];

export default emailTemplateRoutes;
