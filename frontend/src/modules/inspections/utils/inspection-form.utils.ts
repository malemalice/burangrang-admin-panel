import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

/**
 * Generate inspection code: INS + YYMMDDHHmmss.
 * Includes seconds to reduce collision probability.
 */
export function generateInspectionCode(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const date = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  return `INS${year}${month}${date}${hour}${minute}${second}`;
}

/**
 * Default inspection status based on inspection date:
 * SCHEDULED when date is in the future, otherwise DONE.
 */
export function getDefaultInspectionStatus(inspectionDate: string): GeneralStatusEnum {
  if (!inspectionDate) return GeneralStatusEnum.SCHEDULED;
  const date = new Date(inspectionDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date > today ? GeneralStatusEnum.SCHEDULED : GeneralStatusEnum.DONE;
}
