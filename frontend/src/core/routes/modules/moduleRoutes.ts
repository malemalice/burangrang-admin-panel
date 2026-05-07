import { RouteConfig } from '../types';
import { adminOverviewRoutes } from '@/modules/admin-overview';
import { personalHomeRoutes } from '@/modules/personal-home';
import { riskAssessmentRoutes } from '@/modules/risk-assessment';
import { workPermitRoutes } from '@/modules/work-permits';
import { environmentalMeasurementRoutes } from '@/modules/environmental-measurements';
import { wasteManagementRoutes } from '@/modules/waste-management';
import { inspectionsRoutes } from '@/modules/inspections';
import { auditPolicyRoutes } from '@/modules/audit-policy';
import riskRegisterRoutes from '@/modules/risk-register/routes/riskRegisterRoutes';
import incidentsRoutes from '@/modules/incidents/routes/incidentsRoutes';
import incidentSecurityRoutes from '@/modules/incident-security/routes/incidentSecurityRoutes';
import investigationReportsRoutes from '@/modules/investigation-reports/routes/investigationReportsRoutes';

/**
 * Module routes for operational components
 */
const moduleRoutes: RouteConfig[] = [
  ...adminOverviewRoutes,
  ...personalHomeRoutes,
  ...riskAssessmentRoutes,
  ...workPermitRoutes,
  ...environmentalMeasurementRoutes,
  ...wasteManagementRoutes,
  ...inspectionsRoutes,
  ...auditPolicyRoutes,
  ...riskRegisterRoutes,
  ...incidentsRoutes,
  ...incidentSecurityRoutes,
  ...investigationReportsRoutes,
];

export default moduleRoutes;

