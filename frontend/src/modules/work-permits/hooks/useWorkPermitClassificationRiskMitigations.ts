import { useEffect, useMemo, useRef, useState } from 'react';
import riskMitigationService, {
  type RiskMitigation,
} from '@/modules/risk-assessment/services/riskMitigationService';
import type { WorkPermitClassification } from '../types/work-permit.types';

/**
 * Loads master risk mitigations for every distinct risk referenced on permit classification safety guidance rows.
 * When `prefetchedMitigationsByRiskId` includes every current risk id (e.g. public token GET), skips JWT `/risk-mitigations` calls.
 */
export function useWorkPermitClassificationRiskMitigations(
  classifications: WorkPermitClassification[] | undefined,
  prefetchedMitigationsByRiskId?: Record<string, RiskMitigation[] | null | undefined> | null,
) {
  const [mitigationsByRiskId, setMitigationsByRiskId] = useState<Record<string, RiskMitigation[]>>(
    {},
  );
  const [mitigationsLoadingByRiskId, setMitigationsLoadingByRiskId] = useState<
    Record<string, boolean>
  >({});
  const [mitigationsErrorByRiskId, setMitigationsErrorByRiskId] = useState<
    Record<string, string | undefined>
  >({});
  const isMountedRef = useRef(true);
  const mitigationsInFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const distinctRiskIds = useMemo(() => {
    const rows = classifications?.flatMap((c) => c.safetyGuidanceRows ?? []) ?? [];
    const ids = rows
      .map((r) => r.risk?.id ?? r.riskId)
      .filter((id): id is string => !!id);
    return Array.from(new Set(ids));
  }, [classifications]);

  const distinctRiskIdsKey = useMemo(
    () => distinctRiskIds.slice().sort().join(','),
    [distinctRiskIds],
  );

  useEffect(() => {
    setMitigationsByRiskId({});
    setMitigationsLoadingByRiskId({});
    setMitigationsErrorByRiskId({});
  }, [distinctRiskIdsKey]);

  useEffect(() => {
    if (distinctRiskIds.length === 0) return;

    const pref = prefetchedMitigationsByRiskId;
    if (
      pref != null &&
      distinctRiskIds.every((id) => Object.prototype.hasOwnProperty.call(pref, id))
    ) {
      if (!isMountedRef.current) return;
      setMitigationsByRiskId(
        Object.fromEntries(distinctRiskIds.map((id) => [id, pref[id] ?? []] as const)),
      );
      setMitigationsLoadingByRiskId({});
      setMitigationsErrorByRiskId({});
      return;
    }

    const loadMitigations = async (riskId: string) => {
      mitigationsInFlightRef.current.add(riskId);
      try {
        setMitigationsLoadingByRiskId((prev) => ({ ...prev, [riskId]: true }));
        setMitigationsErrorByRiskId((prev) => ({ ...prev, [riskId]: undefined }));

        const mitigations = await riskMitigationService.getByRiskId(riskId);
        if (!isMountedRef.current) return;
        setMitigationsByRiskId((prev) => ({ ...prev, [riskId]: mitigations }));
      } catch (e) {
        console.error(e);
        if (!isMountedRef.current) return;
        setMitigationsErrorByRiskId((prev) => ({
          ...prev,
          [riskId]: 'Failed to load mitigation information',
        }));
        setMitigationsByRiskId((prev) => ({ ...prev, [riskId]: [] }));
      } finally {
        mitigationsInFlightRef.current.delete(riskId);
        if (!isMountedRef.current) return;
        setMitigationsLoadingByRiskId((prev) => ({ ...prev, [riskId]: false }));
      }
    };

    distinctRiskIds.forEach((riskId) => {
      if (mitigationsByRiskId[riskId] !== undefined) return;
      if (mitigationsInFlightRef.current.has(riskId)) return;
      void loadMitigations(riskId);
    });
  }, [distinctRiskIds, mitigationsByRiskId, prefetchedMitigationsByRiskId]);

  const mitigationsPending =
    distinctRiskIds.length > 0 &&
    distinctRiskIds.some((id) => mitigationsByRiskId[id] === undefined);

  return {
    mitigationsByRiskId,
    mitigationsLoadingByRiskId,
    mitigationsErrorByRiskId,
    mitigationsPending,
    distinctRiskIds,
  };
}
