import { RouteConfig } from '../types';
import { riskAssessmentRoutes } from '@/modules/risk-assessment';
import { workPermitRoutes } from '@/modules/work-permits';

/**
 * Module routes for operational components
 */
const moduleRoutes: RouteConfig[] = [
  ...riskAssessmentRoutes,
  ...workPermitRoutes,
];

export default moduleRoutes;
