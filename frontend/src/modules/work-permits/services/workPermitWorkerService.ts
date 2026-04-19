import api from '@/core/lib/api';
import userService from '@/modules/users/services/userService';
import type { User, PaginatedResponse, PaginationParams } from '@/core/lib/types';
import type { WorkPermitWorkerProfileDTO } from '../types/work-permit-worker-profile.types';

/** Backend role.code for work-permit workers (Contractor) */
export const WORK_PERMIT_WORKER_ROLE_CODE = 'CONTRACTOR';

const workPermitWorkerService = {
  /**
   * Lists contractor users. Backend scopes by requester company unless Super Admin.
   * Pass `companyId` in filters only for Super Admin to narrow by company.
   */
  async fetchWorkers(
    params: PaginationParams & { companyIdFilter?: string },
  ): Promise<PaginatedResponse<User>> {
    const { companyIdFilter, filters: baseFilters, ...rest } = params;
    const filters: Record<string, string> = {
      ...(baseFilters as Record<string, string> | undefined),
      roleCode: WORK_PERMIT_WORKER_ROLE_CODE,
    };
    if (companyIdFilter) {
      filters.companyId = companyIdFilter;
    }
    return userService.getUsers({
      ...rest,
      filters,
    });
  },

  async getWorkPermitWorkerProfile(
    userId: string,
  ): Promise<WorkPermitWorkerProfileDTO> {
    const { data } = await api.get<WorkPermitWorkerProfileDTO>(
      `/users/${userId}/work-permit-worker-profile`,
    );
    return data;
  },
};

export default workPermitWorkerService;
