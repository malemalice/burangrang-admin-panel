/**
 * Dispatch order workflow — no DRAFT; use SCHEDULED for approved/scheduled dispatch.
 * Matches Prisma GeneralStatusEnum subset.
 */
export enum DispatchOrderStatusEnum {
  SCHEDULED = 'SCHEDULED',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  DONE = 'DONE',
  REJECTED = 'REJECTED',
}
