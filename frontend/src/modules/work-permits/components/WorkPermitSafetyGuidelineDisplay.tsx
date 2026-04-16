import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type { RiskMitigation } from '@/modules/risk-assessment/services/riskMitigationService';
import type { WorkPermitClassification } from '../types/work-permit.types';
import { getCombinedMitigationText } from '../utils/riskMitigationDisplay';

export function WorkPermitSafetyGuidelineDisplay({
  classifications,
  showGuidelineNarrative = false,
  mitigationsByRiskId = {},
  mitigationsLoadingByRiskId = {},
  mitigationsErrorByRiskId = {},
}: {
  classifications?: WorkPermitClassification[];
  /** When true, render HSE-authored guideline HTML (TipTap). When false, structured rows still show. */
  showGuidelineNarrative?: boolean;
  mitigationsByRiskId?: Record<string, RiskMitigation[]>;
  mitigationsLoadingByRiskId?: Record<string, boolean>;
  mitigationsErrorByRiskId?: Record<string, string | undefined>;
}) {
  if (!classifications?.length) {
    return <p className="text-sm text-muted-foreground">No safety guideline content.</p>;
  }

  return (
    <div className="space-y-6">
      {classifications.map((c) => {
        const guidelineHtml =
          c.safetyGuidelineSnapshot?.trim() ||
          c.workClassification?.safetyGuideline?.trim() ||
          '';
        const classificationDescription = c.workClassification?.description?.trim() ?? '';
        const hasRows = (c.safetyGuidanceRows?.length ?? 0) > 0;
        const showNarrativeBlock = showGuidelineNarrative && Boolean(guidelineHtml);
        const hasAnyContent = hasRows || showNarrativeBlock || Boolean(classificationDescription);

        const rowsSorted = (c.safetyGuidanceRows ?? [])
          .slice()
          .sort((a, b) => a.order - b.order);

        return (
          <div key={c.id} className="space-y-3 border rounded-lg p-4">
            <p className="font-medium text-sm">
              {c.workClassification?.name ?? '—'}{' '}
              {c.workClassification?.code ? `(${c.workClassification.code})` : ''}
            </p>
            {classificationDescription ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{classificationDescription}</p>
            ) : null}
            {!hasAnyContent ? (
              <p className="text-sm text-muted-foreground">
                No safety guideline content for this classification.
              </p>
            ) : null}
            {showNarrativeBlock ? (
              <div
                className="prose prose-sm max-w-none text-sm border rounded p-2 bg-muted/20"
                dangerouslySetInnerHTML={{ __html: guidelineHtml }}
              />
            ) : null}
            {hasRows ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk</TableHead>
                    <TableHead>Safety equipment</TableHead>
                    <TableHead>Mitigation</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rowsSorted.map((r) => {
                    const riskId = r.risk?.id ?? r.riskId;
                    const isMitigationLoading = !!mitigationsLoadingByRiskId[riskId];
                    const mitigationError = mitigationsErrorByRiskId[riskId];
                    const mitigationsForRisk = riskId ? mitigationsByRiskId[riskId] : undefined;
                    const mitText =
                      mitigationsForRisk === undefined
                        ? ''
                        : getCombinedMitigationText(mitigationsForRisk);

                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          {r.risk ? `${r.risk.name} (${r.risk.code})` : r.riskNameSnapshot ?? r.riskId}
                        </TableCell>
                        <TableCell>
                          {r.safetyEquipment
                            ? `${r.safetyEquipment.name} (${r.safetyEquipment.code})`
                            : r.safetyEquipmentNameSnapshot ?? r.safetyEquipmentId}
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap text-muted-foreground">
                          {!riskId ? (
                            '—'
                          ) : isMitigationLoading ? (
                            'Loading…'
                          ) : mitigationError ? (
                            <span className="text-destructive">{mitigationError}</span>
                          ) : mitigationsForRisk === undefined ? (
                            '—'
                          ) : mitText.length === 0 ? (
                            '—'
                          ) : (
                            mitText
                          )}
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap">{r.notes ?? '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
