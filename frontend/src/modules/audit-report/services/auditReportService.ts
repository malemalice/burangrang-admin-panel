import api from '@/core/lib/api';
import { AuditReport, AuditPeriodOption } from '../types/audit-report.types';

const getReport = async (periodId: string): Promise<AuditReport> => {
  const res = await api.get('/audit-schedules/report', { params: { periodId } });
  return res.data as AuditReport;
};

const getPeriods = async (): Promise<AuditPeriodOption[]> => {
  const res = await api.get('/audit-periods', {
    params: { options: true, limit: 1000, sortOrder: 'desc' },
  });
  return (res.data?.data ?? []) as AuditPeriodOption[];
};

const auditReportService = { getReport, getPeriods };
export default auditReportService;
