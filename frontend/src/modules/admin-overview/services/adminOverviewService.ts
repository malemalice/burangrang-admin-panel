import api from '@/core/lib/api';
import type { AdminOverviewData } from '../types/admin-overview.types';

const adminOverviewService = {
  getOverviewData: async (): Promise<AdminOverviewData> => {
    const response = await api.get<AdminOverviewData>('/dashboard/admin-overview');
    return response.data;
  },
};

export default adminOverviewService;
