import { RouteConfig } from '../types';
import {
  RiskAssessmentsPage,
  CreateRiskAssessmentPage,
  EditRiskAssessmentPage,
  RiskAssessmentDetailPage
} from '@/core/pages/risk-assessment';

/**
 * Module routes for operational components
 */
const moduleRoutes: RouteConfig[] = [
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

export default moduleRoutes;
