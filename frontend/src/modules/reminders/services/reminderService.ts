import api from '@/core/lib/api';
import {
  Reminder,
  PaginatedResponse,
  PaginationParams,
  ReminderDTO,
  CreateReminderDTO,
  UpdateReminderDTO,
  ReminderLog,
  ReminderOccurrence,
  ReminderOccurrenceDTO,
  FindOccurrencesParams,
} from '../types/reminder.types';

const mapReminderDtoToReminder = (dto: ReminderDTO): Reminder => ({
  id: dto.id,
  targetType: dto.targetType,
  targetId: dto.targetId,
  createdBy: dto.createdBy,
  entity: dto.entity,
  entityId: dto.entityId,
  subjectType: dto.subjectType,
  subjectId: dto.subjectId,
  message: dto.message,
  remindAt: dto.remindAt,
  repeatType: dto.repeatType,
  repeatUntil: dto.repeatUntil,
  dayOfMonth: dto.dayOfMonth,
  dayOfWeek: dto.dayOfWeek,
  status: dto.status,
  lastSentAt: dto.lastSentAt ?? undefined,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
});

const mapOccurrenceDto = (dto: ReminderOccurrenceDTO): ReminderOccurrence => ({
  ...dto,
});

const reminderService = {
  getReminders: async (
    params: PaginationParams,
  ): Promise<PaginatedResponse<Reminder>> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
      queryParams.append('sortOrder', params.sortOrder || 'asc');
    }
    if (params.search) queryParams.append('search', params.search);
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/reminders?${queryParams.toString()}`);
    return {
      data: response.data.data.map(mapReminderDtoToReminder),
      meta: response.data.meta,
    };
  },

  getReminderById: async (id: string): Promise<Reminder> => {
    const response = await api.get(`/reminders/${id}`);
    return mapReminderDtoToReminder(response.data);
  },

  getReminderLogs: async (id: string): Promise<ReminderLog[]> => {
    const response = await api.get(`/reminders/${id}/logs`);
    return response.data.map((log: any) => ({
      id: log.id,
      reminderId: log.reminderId,
      executionStatus: log.executionStatus,
      executionDuration: log.executionDuration,
      failureReason: log.failureReason,
      notificationId: log.notificationId,
      emailSent: log.emailSent,
      emailError: log.emailError,
      executedAt: log.executedAt,
      createdAt: log.createdAt,
    }));
  },

  createReminder: async (data: CreateReminderDTO): Promise<Reminder> => {
    try {
      const response = await api.post('/reminders', data);
      return mapReminderDtoToReminder(response.data);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create reminder',
      );
    }
  },

  updateReminder: async (
    id: string,
    data: UpdateReminderDTO,
  ): Promise<Reminder> => {
    try {
      const response = await api.patch(`/reminders/${id}`, data);
      return mapReminderDtoToReminder(response.data);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update reminder',
      );
    }
  },

  deleteReminder: async (id: string): Promise<void> => {
    try {
      await api.delete(`/reminders/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete reminder',
      );
    }
  },

  triggerNotification: async (
    id: string,
  ): Promise<{ success: boolean; message: string; notificationId?: string }> => {
    try {
      const response = await api.post(`/reminders/${id}/trigger`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to trigger notification',
      );
    }
  },

  // ----- Occurrences -----

  getOccurrences: async (
    params: FindOccurrencesParams,
  ): Promise<ReminderOccurrence[]> => {
    const qp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qp.append(k, String(v));
    });
    const response = await api.get(`/reminders/occurrences?${qp.toString()}`);
    return (response.data as ReminderOccurrenceDTO[]).map(mapOccurrenceDto);
  },

  acknowledgeOccurrence: async (id: string): Promise<ReminderOccurrence> => {
    const response = await api.patch(`/reminders/occurrences/${id}/acknowledge`);
    return mapOccurrenceDto(response.data);
  },

  dismissOccurrence: async (id: string): Promise<ReminderOccurrence> => {
    const response = await api.patch(`/reminders/occurrences/${id}/dismiss`);
    return mapOccurrenceDto(response.data);
  },
};

export default reminderService;
