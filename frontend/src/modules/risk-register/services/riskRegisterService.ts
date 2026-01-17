import { RiskRegister, FindRiskRegisterParams } from '../types/risk-register.types';
import { PaginatedResponse } from '@/core/lib/types';
import api from '@/core/lib/api';

const riskRegisterService = {
  getAll: async (params: FindRiskRegisterParams): Promise<PaginatedResponse<RiskRegister>> => {
    const response = await api.get('/risk-register', { params });
    return response.data;
  },

  getById: async (id: string): Promise<RiskRegister> => {
    const response = await api.get(`/risk-register/${id}`);
    return response.data;
  },
};

export default riskRegisterService;
