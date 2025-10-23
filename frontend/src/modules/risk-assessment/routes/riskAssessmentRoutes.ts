import { RouteConfig } from '@/core/routes/types';
import RiskAssessmentsPage from '../pages/RiskAssessmentsPage';
import CreateRiskAssessmentPage from '../pages/CreateRiskAssessmentPage';
import EditRiskAssessmentPage from '../pages/EditRiskAssessmentPage';
import RiskAssessmentDetailPage from '../pages/RiskAssessmentDetailPage';

/**
 * Risk Assessment module routes
 */
const riskAssessmentRoutes: RouteConfig[] = [
  {
    path: '/risk-assessment',
    component: RiskAssessmentsPage,
  },
  {
    path: '/risk-assessment/new',
    component: CreateRiskAssessmentPage,
  },
  {
    path: '/risk-assessment/:id',
    component: RiskAssessmentDetailPage,
  },
  {
    path: '/risk-assessment/:id/edit',
    component: EditRiskAssessmentPage,
  },
];

export default riskAssessmentRoutes;

