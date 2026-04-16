import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader } from '@/core/components/ui/card';
import { Textarea } from '@/core/components/ui/textarea';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { Plus, X } from 'lucide-react';
import { WorkPermitSection, WorkPermitSubsectionTitle } from './WorkPermitSection';
import { WORK_PERMIT_SECTIONS, WORK_PERMIT_SECTION_G_SUB } from '../constants/workPermitSections';
import type { WorkClassificationMasterOption } from '../types/work-permit.types';
import type { SafetyEquipment } from '@/modules/ppe';

export type SafetyGuidanceBlock = {
  workPermitClassificationId?: string;
  workClassificationId: string;
  order: number;
  safetyGuidelineSnapshot?: string | null;
  rows: Array<{
    riskId: string;
    safetyEquipmentId: string;
    notes?: string;
    order: number;
  }>;
};

type Props = {
  blocks: SafetyGuidanceBlock[];
  onChange: (blocks: SafetyGuidanceBlock[]) => void;
  workClassifications: WorkClassificationMasterOption[];
  risks: Array<{ id: string; name: string; code: string }>;
  safetyEquipment: SafetyEquipment[];
};

export function WorkPermitSafetyGuidelineSection({
  blocks,
  onChange,
  workClassifications,
  risks,
  safetyEquipment,
}: Props) {
  const updateBlock = (idx: number, partial: Partial<SafetyGuidanceBlock>) => {
    const next = [...blocks];
    next[idx] = { ...next[idx], ...partial };
    onChange(next);
  };

  const updateRow = (blockIdx: number, rowIdx: number, partial: Partial<SafetyGuidanceBlock['rows'][0]>) => {
    const next = [...blocks];
    const rows = [...next[blockIdx].rows];
    rows[rowIdx] = { ...rows[rowIdx], ...partial };
    next[blockIdx] = { ...next[blockIdx], rows };
    onChange(next);
  };

  const addRow = (blockIdx: number) => {
    const next = [...blocks];
    next[blockIdx] = {
      ...next[blockIdx],
      rows: [
        ...next[blockIdx].rows,
        {
          riskId: '',
          safetyEquipmentId: '',
          notes: '',
          order: next[blockIdx].rows.length,
        },
      ],
    };
    onChange(next);
  };

  const removeRow = (blockIdx: number, rowIdx: number) => {
    const next = [...blocks];
    next[blockIdx] = {
      ...next[blockIdx],
      rows: next[blockIdx].rows.filter((_, i) => i !== rowIdx).map((r, i) => ({ ...r, order: i })),
    };
    onChange(next);
  };

  const riskOptions = risks.map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }));
  const eqOptions = safetyEquipment.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));

  return (
    <WorkPermitSection
      id="work-permit-section-g"
      title={WORK_PERMIT_SECTIONS.G}
      description="Copied from each work classification; HSE may adjust before applicant sign. Removing a classification removes its block."
    >
      {blocks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Select at least one work classification in Section A to load safety guidance.
          </CardContent>
        </Card>
      ) : (
        blocks.map((block, bi) => {
          const wc = workClassifications.find((w) => w.id === block.workClassificationId);
          const title = wc ? `${wc.name} (${wc.code})` : block.workClassificationId;
          return (
            <Card key={`${block.workClassificationId}-${block.order}`} className="mb-4">
              <CardHeader>
                <WorkPermitSubsectionTitle>
                  {WORK_PERMIT_SECTION_G_SUB.byClassification}: {title}
                </WorkPermitSubsectionTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{WORK_PERMIT_SECTION_G_SUB.guidelineText}</label>
                  <Textarea
                    className="mt-1 font-mono text-xs"
                    rows={8}
                    value={block.safetyGuidelineSnapshot ?? ''}
                    onChange={(e) => updateBlock(bi, { safetyGuidelineSnapshot: e.target.value })}
                    placeholder="Guideline content (HTML or text copied from master)"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_G_SUB.riskEquipmentRows}</WorkPermitSubsectionTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => addRow(bi)}>
                      <Plus className="h-4 w-4 mr-1" /> Add row
                    </Button>
                  </div>
                  {block.rows.map((row, ri) => (
                    <div key={ri} className="flex flex-wrap gap-2 items-end border rounded p-3 mb-2">
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-xs text-muted-foreground">Risk</label>
                        <SearchableSelect
                          options={riskOptions}
                          value={row.riskId}
                          onValueChange={(v) => updateRow(bi, ri, { riskId: v })}
                          placeholder="Select risk"
                          searchPlaceholder="Search..."
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-xs text-muted-foreground">Safety equipment</label>
                        <SearchableSelect
                          options={eqOptions}
                          value={row.safetyEquipmentId}
                          onValueChange={(v) => updateRow(bi, ri, { safetyEquipmentId: v })}
                          placeholder="Select equipment"
                          searchPlaceholder="Search..."
                        />
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <label className="text-xs text-muted-foreground">Notes</label>
                        <Textarea
                          rows={2}
                          value={row.notes ?? ''}
                          onChange={(e) => updateRow(bi, ri, { notes: e.target.value })}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(bi, ri)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </WorkPermitSection>
  );
}
