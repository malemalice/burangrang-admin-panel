import { RouteConfig } from '@/core/routes/types';
import EmailTemplatesPage from '../pages/EmailTemplatesPage';
import CreateEmailTemplatePage from '../pages/CreateEmailTemplatePage';
import EditEmailTemplatePage from '../pages/EditEmailTemplatePage';
import EmailTemplateDetailPage from '../pages/EmailTemplateDetailPage';

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


