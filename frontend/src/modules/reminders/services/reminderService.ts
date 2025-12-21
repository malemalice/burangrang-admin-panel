import api from '@/core/lib/api';
import {
  Reminder,
  PaginatedResponse,
  PaginationParams,
  ReminderDTO,
  CreateReminderDTO,
  UpdateReminderDTO,
  ReminderLog,
} from '../types/reminder.types';

// Convert ReminderDTO from backend to Reminder model for frontend
const mapReminderDtoToReminder = (reminderDto: ReminderDTO): Reminder => {
  return {
    id: reminderDto.id,
    userId: reminderDto.userId,
    entity: reminderDto.entity,
    entityId: reminderDto.entityId,
    message: reminderDto.message,
    remindAt: reminderDto.remindAt,
    repeatType: reminderDto.repeatType,
    repeatUntil: reminderDto.repeatUntil,
    status: reminderDto.status,
    lastSentAt: reminderDto.lastSentAt || undefined,
    createdAt: reminderDto.createdAt,
    updatedAt: reminderDto.updatedAt,
  };
};

// Convert Reminder from frontend to UpdateReminderDTO for backend
const mapReminderToUpdateDto = (reminder: Partial<Reminder>): UpdateReminderDTO => {
  return {
    entity: reminder.entity,
    entityId: reminder.entityId,
    message: reminder.message,
    remindAt: reminder.remindAt,
    repeatType: reminder.repeatType,
    repeatUntil: reminder.repeatUntil,
    status: reminder.status,
  };
};

const reminderService = {
  // Get all reminders with pagination and filtering
  getReminders: async (params: PaginationParams): Promise<PaginatedResponse<Reminder>> => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
      });

      // Add sorting if provided
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
        queryParams.append('sortOrder', params.sortOrder || 'asc');
      }

      // Add search if provided
      if (params.search) {
        queryParams.append('search', params.search);
      }

      // Add any additional filters
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
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  },

  // Get a single reminder by ID
  getReminderById: async (id: string): Promise<Reminder> => {
    try {
      const response = await api.get(`/reminders/${id}`);
      return mapReminderDtoToReminder(response.data);
    } catch (error) {
      console.error(`Error fetching reminder ${id}:`, error);
      throw error;
    }
  },

  // Get reminder logs
  getReminderLogs: async (id: string): Promise<ReminderLog[]> => {
    try {
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
    } catch (error) {
      console.error(`Error fetching reminder logs ${id}:`, error);
      throw error;
    }
  },

  // Create a new reminder
  createReminder: async (reminderData: CreateReminderDTO): Promise<Reminder> => {
    try {
      const response = await api.post('/reminders', reminderData);
      return mapReminderDtoToReminder(response.data);
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create reminder';
      throw new Error(errorMessage);
    }
  },

  // Update an existing reminder
  updateReminder: async (id: string, reminderData: UpdateReminderDTO): Promise<Reminder> => {
    try {
      const response = await api.patch(`/reminders/${id}`, reminderData);
      return mapReminderDtoToReminder(response.data);
    } catch (error: any) {
      console.error(`Error updating reminder ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to update reminder';
      throw new Error(errorMessage);
    }
  },

  // Delete a reminder
  deleteReminder: async (id: string): Promise<void> => {
    try {
      await api.delete(`/reminders/${id}`);
    } catch (error: any) {
      console.error(`Error deleting reminder ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to delete reminder';
      throw new Error(errorMessage);
    }
  },

  // Manually trigger notification for a reminder
  triggerNotification: async (id: string): Promise<{ success: boolean; message: string; notificationId?: string }> => {
    try {
      const response = await api.post(`/reminders/${id}/trigger`);
      return response.data;
    } catch (error: any) {
      console.error(`Error triggering notification for reminder ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to trigger notification';
      throw new Error(errorMessage);
    }
  },
};

export default reminderService;

