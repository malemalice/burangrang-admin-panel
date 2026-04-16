import type { RiskMitigation } from '@/modules/risk-assessment/services/riskMitigationService';

/** Human-readable combined text for master risk mitigations (Eliminate / Transfer / Reduce / Accept). */
export function getCombinedMitigationText(mitigations: RiskMitigation[]): string {
  const parts = mitigations.flatMap((m) => {
    const items: Array<{ label: string; value: string }> = [];
    if (m.eliminate?.trim()) items.push({ label: 'Eliminate', value: m.eliminate });
    if (m.transfer?.trim()) items.push({ label: 'Transfer', value: m.transfer });
    if (m.reduce?.trim()) items.push({ label: 'Reduce', value: m.reduce });
    if (m.accept?.trim()) items.push({ label: 'Accept', value: m.accept });
    return items;
  });

  return parts.map((p) => `${p.label}\n${p.value}`).join('\n\n');
}
