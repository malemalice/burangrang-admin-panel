import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import reminderService from '../services/reminderService';
import {
  Reminder,
  PaginatedResponse,
  ReminderSearchParams,
  CreateReminderDTO,
  UpdateReminderDTO,
  ReminderStats,
  ReminderLog,
} from '../types/reminder.types';

/**
 * Custom hook for managing reminders
 */
export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [totalReminders, setTotalReminders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reminders with pagination and filters
  const fetchReminders = async (params: ReminderSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Reminder> = await reminderService.getReminders(params);
      setReminders(response.data);
      setTotalReminders(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reminders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new reminder
  const createReminder = async (reminderData: CreateReminderDTO) => {
    try {
      const newReminder = await reminderService.createReminder(reminderData);
      setReminders((prev) => [newReminder, ...prev]);
      setTotalReminders((prev) => prev + 1);
      toast.success('Reminder created successfully');
      return newReminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create reminder';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing reminder
  const updateReminder = async (id: string, reminderData: UpdateReminderDTO) => {
    try {
      const updatedReminder = await reminderService.updateReminder(id, reminderData);
      setReminders((prev) => prev.map((reminder) => (reminder.id === id ? updatedReminder : reminder)));
      toast.success('Reminder updated successfully');
      return updatedReminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reminder';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a reminder
  const deleteReminder = async (id: string) => {
    try {
      await reminderService.deleteReminder(id);
      setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
      setTotalReminders((prev) => prev - 1);
      toast.success('Reminder deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete reminder';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    reminders,
    totalReminders,
    currentPage,
    isLoading,
    error,
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
  };
};

/**
 * Custom hook for managing a single reminder
 */
export const useReminder = (reminderId: string | null = null) => {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a single reminder by ID
  const fetchReminder = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const reminderData = await reminderService.getReminderById(id);
      setReminder(reminderData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reminder';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load reminder on mount if reminderId is provided
  useEffect(() => {
    if (reminderId) {
      fetchReminder(reminderId);
    }
  }, [reminderId]);

  return {
    reminder,
    isLoading,
    error,
    fetchReminder,
    setReminder,
  };
};

/**
 * Custom hook for reminder logs
 */
export const useReminderLogs = (reminderId: string | null = null) => {
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reminder logs
  const fetchLogs = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const logsData = await reminderService.getReminderLogs(id);
      setLogs(logsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reminder logs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load logs on mount if reminderId is provided
  useEffect(() => {
    if (reminderId) {
      fetchLogs(reminderId);
    }
  }, [reminderId]);

  return {
    logs,
    isLoading,
    error,
    fetchLogs,
  };
};

/**
 * Custom hook for reminder statistics
 */
export const useReminderStats = () => {
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This would need to be implemented in the reminderService
      // const reminderStats = await reminderService.getReminderStats();
      // setStats(reminderStats);

      // For now, return mock data structure
      const mockStats: ReminderStats = {
        total: 0,
        pending: 0,
        sent: 0,
        expired: 0,
        cancelled: 0,
        failed: 0,
        byEntity: [],
        upcoming: 0,
        overdue: 0,
      };
      setStats(mockStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reminder statistics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};

