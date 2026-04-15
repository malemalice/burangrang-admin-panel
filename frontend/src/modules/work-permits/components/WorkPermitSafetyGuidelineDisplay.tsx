import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type { WorkPermitClassification } from '../types/work-permit.types';

export function WorkPermitSafetyGuidelineDisplay({
  classifications,
}: {
  classifications?: WorkPermitClassification[];
}) {
  if (!classifications?.length) {
    return <p className="text-sm text-muted-foreground">No safety guideline content.</p>;
  }

  return (
    <div className="space-y-6">
      {classifications.map((c) => (
        <div key={c.id} className="space-y-3 border rounded-lg p-4">
          <p className="font-medium text-sm">
            {c.workClassification?.name ?? '—'}{' '}
            {c.workClassification?.code ? `(${c.workClassification.code})` : ''}
          </p>
          {c.safetyGuidelineSnapshot?.trim() ? (
            <div
              className="prose prose-sm max-w-none text-sm border rounded p-2 bg-muted/20"
              dangerouslySetInnerHTML={{ __html: c.safetyGuidelineSnapshot }}
            />
          ) : null}
          {(c.safetyGuidanceRows?.length ?? 0) > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk</TableHead>
                  <TableHead>Safety equipment</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.safetyGuidanceRows!.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.risk ? `${r.risk.name} (${r.risk.code})` : r.riskNameSnapshot ?? r.riskId}
                    </TableCell>
                    <TableCell>
                      {r.safetyEquipment
                        ? `${r.safetyEquipment.name} (${r.safetyEquipment.code})`
                        : r.safetyEquipmentNameSnapshot ?? r.safetyEquipmentId}
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap">{r.notes ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </div>
      ))}
    </div>
  );
}
