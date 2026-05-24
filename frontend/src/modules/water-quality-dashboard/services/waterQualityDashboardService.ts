import api from '@/core/lib/api';
import type {
  WaterQualityDashboardData,
  WaterQualityDashboardQuery,
} from '../types/water-quality-dashboard.types';

const waterQualityDashboardService = {
  getDashboard: async (query: WaterQualityDashboardQuery): Promise<WaterQualityDashboardData> => {
    const params: Record<string, string | number> = {
      category: query.category,
      year: query.year,
    };
    if (query.parameterId) params.parameterId = query.parameterId;

    const response = await api.get<WaterQualityDashboardData>('/dashboard/water-quality-lab', {
      params,
    });
    return response.data;
  },
};

export default waterQualityDashboardService;
