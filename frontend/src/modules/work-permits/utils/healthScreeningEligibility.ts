import type { HealthScreeningListItem } from '@/modules/health-screenings/types/healthScreening.types';
import type { WorkPermitWorker } from '../types/work-permit.types';

/** DONE and still within `validUntil` (or no expiry set). */
export function isHealthScreeningEligible(
  s: { status: string; validUntil?: string | null | undefined },
): boolean {
  if (s.status !== 'DONE') return false;
  if (s.validUntil) {
    return new Date(s.validUntil).getTime() >= Date.now();
  }
  return true;
}

export function isHealthScreeningListItemEligible(s: HealthScreeningListItem): boolean {
  return isHealthScreeningEligible(s);
}

export function hasHealthDeclarationFile(url?: string | null): boolean {
  return Boolean(url && String(url).trim().length > 0);
}

/**
 * A worker satisfies submit rules: declaration file on profile and/or a completed online declaration still in the validity window.
 * Matches work-permit `validateWorkerHealthDeclarations` + expiry expectations at submit.
 */
export function isWorkPermitWorkerHealthSatisfiedForSubmit(
  w: Pick<WorkPermitWorker, 'healthScreening' | 'healthDeclarationUrl'>,
): boolean {
  if (hasHealthDeclarationFile(w.healthDeclarationUrl)) return true;
  if (w.healthScreening && isHealthScreeningEligible(w.healthScreening)) return true;
  return false;
}
