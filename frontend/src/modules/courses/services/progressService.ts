import api from '@/core/lib/api';
import { Progress, UpdateProgressDTO } from '../types/course.types';

export const progressService = {
  getProgress: async (enrollmentId: string, chapterId: string): Promise<Progress> => {
    const response = await api.get(`/enrollments/${enrollmentId}/progress/${chapterId}`);
    return response.data;
  },

  updateProgress: async (
    enrollmentId: string,
    chapterId: string,
    data: UpdateProgressDTO
  ): Promise<Progress> => {
    const response = await api.patch(`/enrollments/${enrollmentId}/progress/${chapterId}`, data);
    return response.data;
  },

  completeChapter: async (enrollmentId: string, chapterId: string): Promise<Progress> => {
    const response = await api.post(`/enrollments/${enrollmentId}/progress/${chapterId}/complete`);
    return response.data;
  },
};

export default progressService;
