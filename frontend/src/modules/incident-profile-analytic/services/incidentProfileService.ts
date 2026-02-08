import api from '@/core/lib/api';
import type {
  IncidentProfileData,
  IncidentProfileFilterParams,
} from '../types/incident-profile.types';

const incidentProfileService = {
  getIncidentProfileData: async (
    params?: IncidentProfileFilterParams
  ): Promise<IncidentProfileData> => {
    const queryParams = new URLSearchParams();
    if (params?.fiscalYears?.length) {
      params.fiscalYears.forEach((fy) => queryParams.append('fiscalYears', fy));
    }
    const response = await api.get<IncidentProfileData>(
      `/dashboard/incident-profile${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },
};

export default incidentProfileService;
