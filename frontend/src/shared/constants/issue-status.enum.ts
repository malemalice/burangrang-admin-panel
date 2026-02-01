/**
 * Issue Status Enum Constants
 * Used for inspection items status values
 * Must match backend IssueStatus enum
 */
export enum IssueStatus {
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  CLOSE = 'CLOSE',
}

/**
 * Issue Status Options for UI/Forms
 */
export const ISSUE_STATUS_OPTIONS = [
  { value: IssueStatus.OPEN, label: 'Open Issue' },
  { value: IssueStatus.WAITING_APPROVAL, label: 'Waiting Verification' },
  { value: IssueStatus.CLOSE, label: 'Close' },
] as const;
