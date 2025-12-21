import { RouteConfig } from '../types';
import { riskAssessmentRoutes } from '@/modules/risk-assessment';
import { workPermitRoutes } from '@/modules/work-permits';
import { environmentalMeasurementRoutes } from '@/modules/environmental-measurements';
import { wasteManagementRoutes } from '@/modules/waste-management';

/**
 * Module routes for operational components
 */
const moduleRoutes: RouteConfig[] = [
  ...riskAssessmentRoutes,
  ...workPermitRoutes,
  ...environmentalMeasurementRoutes,
  ...wasteManagementRoutes,
];

export default moduleRoutes;

