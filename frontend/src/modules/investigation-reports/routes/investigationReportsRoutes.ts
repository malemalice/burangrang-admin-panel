import { RouteConfig } from '@/core/routes/types';
import InvestigationReportsPage from '../pages/InvestigationReportsPage';
import CreateInvestigationReportPage from '../pages/CreateInvestigationReportPage';
import EditInvestigationReportPage from '../pages/EditInvestigationReportPage';
import InvestigationReportDetailPage from '../pages/InvestigationReportDetailPage';

const investigationReportsRoutes: RouteConfig[] = [
  { path: '/investigation-reports', component: InvestigationReportsPage },
  { path: '/investigation-reports/new', component: CreateInvestigationReportPage },
  { path: '/investigation-reports/:id/edit', component: EditInvestigationReportPage },
  { path: '/investigation-reports/:id', component: InvestigationReportDetailPage },
];

export default investigationReportsRoutes;
