import type { RiskMitigation } from '@/modules/risk-assessment/services/riskMitigationService';

/** Human-readable combined text for master risk mitigations (ordered). */
export function getCombinedMitigationText(mitigations: RiskMitigation[]): string {
  const parts = mitigations.flatMap((m) => {
    const items: Array<{ label: string; value: string }> = [];
    if (m.eliminationControl?.trim()) items.push({ label: 'Elimination Control', value: m.eliminationControl });
    if (m.substitutionControl?.trim()) items.push({ label: 'Substitution Control', value: m.substitutionControl });
    if (m.engineeringControl?.trim()) items.push({ label: 'Engineering Control', value: m.engineeringControl });
    if (m.administrationControl?.trim()) items.push({ label: 'Administration Control', value: m.administrationControl });
    if (m.personalProtectiveEquipment?.trim()) items.push({ label: 'Personal Protective Equipment', value: m.personalProtectiveEquipment });
    if (m.transfer?.trim()) items.push({ label: 'Transfer', value: m.transfer });
    if (m.accept?.trim()) items.push({ label: 'Accept', value: m.accept });
    return items;
  });

  return parts.map((p) => `${p.label}\n${p.value}`).join('\n\n');
}
