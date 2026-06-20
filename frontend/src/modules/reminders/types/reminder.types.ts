/**
 * Reminders module types
 */

export type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

// ----- Enums -----

export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum ReminderRepeatType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum ReminderTargetType {
  USER = 'USER',
  ROLE = 'ROLE',
  DEPARTMENT = 'DEPARTMENT',
  OFFICE = 'OFFICE',
}

export enum ReminderOccurrenceState {
  SCHEDULED = 'SCHEDULED',
  FIRED = 'FIRED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  DISMISSED = 'DISMISSED',
  MISSED = 'MISSED',
  FAILED = 'FAILED',
}

// ----- Core reminder shape -----

export interface ReminderDTO {
  id: string;
  targetType: ReminderTargetType;
  targetId: string;
  createdBy: string;
  entity?: string;
  entityId?: string;
  subjectType?: string;
  subjectId?: string;
  message: string;
  remindAt: string;
  repeatType?: ReminderRepeatType;
  repeatUntil?: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  status: ReminderStatus;
  lastSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  targetType: ReminderTargetType;
  targetId: string;
  createdBy: string;
  entity?: string;
  entityId?: string;
  subjectType?: string;
  subjectId?: string;
  message: string;
  remindAt: string;
  repeatType?: ReminderRepeatType;
  repeatUntil?: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  status: ReminderStatus;
  lastSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderDTO {
  targetType?: ReminderTargetType;
  // Required by backend; left optional here so the legacy ReminderForm (which has no
  // targetId field) still compiles. The new RemindersSection always provides it.
  targetId?: string;
  entity?: string;
  entityId?: string;
  subjectType?: string;
  subjectId?: string;
  message: string;
  remindAt: string;
  repeatType?: ReminderRepeatType;
  repeatUntil?: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  allowPast?: boolean;
}

export interface UpdateReminderDTO {
  targetType?: ReminderTargetType;
  targetId?: string;
  entity?: string;
  entityId?: string;
  subjectType?: string;
  subjectId?: string;
  message?: string;
  remindAt?: string;
  repeatType?: ReminderRepeatType;
  repeatUntil?: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  status?: ReminderStatus;
  allowPast?: boolean;
}

export interface ReminderFormData {
  targetType: ReminderTargetType;
  targetId: string;
  entity?: string;
  entityId?: string;
  subjectType?: string;
  subjectId?: string;
  message: string;
  remindAt: string;
  repeatType: ReminderRepeatType;
  repeatUntil?: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
}

export interface ReminderFilters {
  status?: ReminderStatus;
  targetType?: ReminderTargetType;
  targetId?: string;
  entity?: string;
  entityId?: string;
  subjectType?: string;
  subjectId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

import type { PaginationParams } from '@/core/lib/types';

export interface ReminderSearchParams extends PaginationParams {
  filters?: ReminderFilters;
}

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

// ----- Occurrence shape -----

export interface ReminderOccurrenceDTO {
  id: string;
  reminderId: string;
  scheduledAt: string;
  firedAt?: string;
  state: ReminderOccurrenceState;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  dismissedBy?: string;
  dismissedAt?: string;
  failureReason?: string;
  notificationId?: string;
  message: string;
  entity?: string;
  entityId?: string;
  subjectType?: string;
  subjectId?: string;
  targetType: ReminderTargetType;
  targetId: string;
}

export interface ReminderOccurrence extends ReminderOccurrenceDTO {}

export interface FindOccurrencesParams {
  from: string;
  to: string;
  scope?: 'mine' | 'all';
  entity?: string;
  subjectType?: string;
  subjectId?: string;
  reminderId?: string;
  state?: ReminderOccurrenceState;
}

// ----- Stats -----

export interface ReminderStats {
  total: number;
  pending: number;
  sent: number;
  expired: number;
  cancelled: number;
  failed: number;
  byEntity: Array<{ entity: string; count: number }>;
  upcoming: number;
  overdue: number;
}
