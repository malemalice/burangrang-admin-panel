import type { HealthScreeningListItem } from '@/modules/health-screenings/types/healthScreening.types';
import type { WorkPermitWorker } from '../types/work-permit.types';

/** DONE and not yet consumed by any work permit (single-use rule). */
export function isHealthScreeningEligible(
  s: {
    status: string;
    consumedByWorkPermitId?: string | null | undefined;
    isAvailable?: boolean;
  },
): boolean {
  if (s.status !== 'DONE') return false;
  if (typeof s.isAvailable === 'boolean') return s.isAvailable;
  return s.consumedByWorkPermitId == null;
}

export function isHealthScreeningListItemEligible(s: HealthScreeningListItem): boolean {
  return isHealthScreeningEligible(s);
}

export function hasHealthDeclarationFile(url?: string | null): boolean {
  return Boolean(url && String(url).trim().length > 0);
}

/**
 * A worker satisfies submit rules: declaration file on profile and/or a completed online
 * declaration that is single-use bound to THIS permit.
 */
export function isWorkPermitWorkerHealthSatisfiedForSubmit(
  w: Pick<WorkPermitWorker, 'healthScreening' | 'healthDeclarationUrl'>,
  workPermitId?: string,
): boolean {
  if (hasHealthDeclarationFile(w.healthDeclarationUrl)) return true;
  const hs = w.healthScreening;
  if (!hs || hs.status !== 'DONE') return false;
  if (!workPermitId) return hs.consumedByWorkPermitId == null;
  return hs.consumedByWorkPermitId === workPermitId;
}
