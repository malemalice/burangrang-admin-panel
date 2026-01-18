/**
 * General Status Enum Constants
 * Used across multiple modules for consistent status values
 * Must match backend GeneralStatusEnum
 */
export enum GeneralStatusEnum {
  SCHEDULED = 'SCHEDULED',
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  DONE = 'DONE',
  REJECTED = 'REJECTED',
  CLOSE = 'CLOSE',
}

/**
 * General Status Options for UI/Forms
 */
export const GENERAL_STATUS_OPTIONS = [
  { value: GeneralStatusEnum.SCHEDULED, label: 'Scheduled' },
  { value: GeneralStatusEnum.DRAFT, label: 'Draft' },
  { value: GeneralStatusEnum.OPEN, label: 'Open' },
  { value: GeneralStatusEnum.WAITING_APPROVAL, label: 'Waiting Approval' },
  { value: GeneralStatusEnum.DONE, label: 'Done' },
  { value: GeneralStatusEnum.REJECTED, label: 'Rejected' },
  { value: GeneralStatusEnum.CLOSE, label: 'Closed' },
] as const;

/**
 * Inspection Item Status Options
 * Only includes statuses valid for inspection items: OPEN, WAITING_APPROVAL, CLOSE
 */
export const INSPECTION_ITEM_STATUS_OPTIONS = [
  { value: GeneralStatusEnum.OPEN, label: 'Open Issue' },
  { value: GeneralStatusEnum.WAITING_APPROVAL, label: 'Waiting Verification' },
  { value: GeneralStatusEnum.CLOSE, label: 'Closed' },
] as const;
