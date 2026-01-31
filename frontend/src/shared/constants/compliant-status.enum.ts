/**
 * Compliant Status Enum Constants
 * Used across audit modules for consistent compliant status values
 * Must match backend CompliantStatusEnum (Prisma)
 */
export enum CompliantStatusEnum {
  COMPLY = 'COMPLY',
  NOT_COMPLY_MAJOR = 'NOT_COMPLY_MAJOR',
  NOT_COMPLY_MINOR = 'NOT_COMPLY_MINOR',
}

/**
 * Compliant Status labels for UI
 */
export const COMPLIANT_STATUS_LABELS: Record<CompliantStatusEnum, string> = {
  [CompliantStatusEnum.COMPLY]: 'Comply',
  [CompliantStatusEnum.NOT_COMPLY_MAJOR]: 'Not Comply - Major',
  [CompliantStatusEnum.NOT_COMPLY_MINOR]: 'Not Comply - Minor',
} as const;

/**
 * Compliant Status Options for UI/Forms
 */
export const COMPLIANT_STATUS_OPTIONS = [
  { label: COMPLIANT_STATUS_LABELS[CompliantStatusEnum.COMPLY], value: CompliantStatusEnum.COMPLY },
  { label: COMPLIANT_STATUS_LABELS[CompliantStatusEnum.NOT_COMPLY_MAJOR], value: CompliantStatusEnum.NOT_COMPLY_MAJOR },
  { label: COMPLIANT_STATUS_LABELS[CompliantStatusEnum.NOT_COMPLY_MINOR], value: CompliantStatusEnum.NOT_COMPLY_MINOR },
] as const;

