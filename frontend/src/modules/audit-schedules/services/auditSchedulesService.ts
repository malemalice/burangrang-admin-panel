import {
  AuditSchedule,
  CreateAuditScheduleDTO,
  UpdateAuditScheduleDTO,
} from '../types/audit-schedule.types';
import { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';

const auditSchedulesService = {
  getAll: async (params: PaginationParams & {
    isActive?: boolean;
    areaId?: string;
    auditElementId?: string;
    status?: string;
  }): Promise<PaginatedResponse<AuditSchedule>> => {
    const response = await api.get('/audit-schedules', { params });
    return response.data;
  },

  getById: async (id: string): Promise<AuditSchedule> => {
    const response = await api.get(`/audit-schedules/${id}`);
    return response.data;
  },

  create: async (data: CreateAuditScheduleDTO): Promise<AuditSchedule> => {
    const response = await api.post('/audit-schedules', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateAuditScheduleDTO,
  ): Promise<AuditSchedule> => {
    const response = await api.patch(`/audit-schedules/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/audit-schedules/${id}`);
  },
};

export default auditSchedulesService;
