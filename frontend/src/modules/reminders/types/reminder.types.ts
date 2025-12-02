/**
 * Reminders module types
 */

// Re-export core types that are used by reminders module
export type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

// Reminder status enum
export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

// Reminder repeat type enum
export enum ReminderRepeatType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

// Interface for reminder data from API that matches backend structure
export interface ReminderDTO {
  id: string;
  userId: string;
  entity?: string;
  entityId?: string;
  message: string;
  remindAt: string; // ISO 8601 date string
  repeatType?: ReminderRepeatType;
  repeatUntil?: string; // ISO 8601 date string
  status: ReminderStatus;
  lastSentAt?: string | null; // ISO 8601 date string
  createdAt: string;
  updatedAt: string;
}

// Frontend reminder model
export interface Reminder {
  id: string;
  userId: string;
  entity?: string;
  entityId?: string;
  message: string;
  remindAt: string;
  repeatType?: ReminderRepeatType;
  repeatUntil?: string;
  status: ReminderStatus;
  lastSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a reminder
export interface CreateReminderDTO {
  entity?: string;
  entityId?: string;
  message: string;
  remindAt: string; // ISO 8601 date string
  repeatType?: ReminderRepeatType;
  repeatUntil?: string; // ISO 8601 date string (required if repeatType is not NONE)
}

// Interface for updating a reminder
export interface UpdateReminderDTO {
  entity?: string;
  entityId?: string;
  message?: string;
  remindAt?: string; // ISO 8601 date string
  repeatType?: ReminderRepeatType;
  repeatUntil?: string; // ISO 8601 date string
  status?: ReminderStatus;
}

// Reminder form data for frontend forms
export interface ReminderFormData {
  entity?: string;
  entityId?: string;
  message: string;
  remindAt: string; // ISO 8601 date string
  repeatType: ReminderRepeatType;
  repeatUntil?: string; // ISO 8601 date string
}

// Reminder filter options
export interface ReminderFilters {
  status?: ReminderStatus;
  entity?: string;
  entityId?: string;
  fromDate?: string; // ISO 8601 date string
  toDate?: string; // ISO 8601 date string
  search?: string;
}

// Reminder search parameters
export interface ReminderSearchParams extends PaginationParams {
  filters?: ReminderFilters;
}

// Reminder log interface
export interface ReminderLog {
  id: string;
  reminderId: string;
  executionStatus: 'SUCCESS' | 'FAILED';
  executionDuration?: number;
  failureReason?: string;
  notificationId?: string;
  emailSent: boolean;
  emailError?: string;
  executedAt: string;
  createdAt: string;
}

// Reminder statistics for dashboard/reporting
export interface ReminderStats {
  total: number;
  pending: number;
  sent: number;
  expired: number;
  cancelled: number;
  failed: number;
  byEntity: Array<{
    entity: string;
    count: number;
  }>;
  upcoming: number;
  overdue: number;
}

