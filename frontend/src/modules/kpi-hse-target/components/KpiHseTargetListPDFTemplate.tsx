import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { HseTarget, TYPE_LABELS, MONTH_SHORT_LABELS } from '../types/kpi-hse-target.types';

interface KpiHseTargetListPDFTemplateProps {
  targets: HseTarget[];
}

export function KpiHseTargetListPDFTemplate({ targets }: KpiHseTargetListPDFTemplateProps) {
  return (
    <div className="bg-white p-8 space-y-6">
      <div className="text-center border-b-2 border-foreground pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">
          KPI HSE Target
        </h1>
        <p className="text-sm text-muted-foreground">
          Export date: {format(new Date(), 'dd MMMM yyyy HH:mm')} — {targets.length} record(s)
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-muted/50 font-semibold">Type</TableHead>
            <TableHead className="bg-muted/50 font-semibold">Code</TableHead>
            <TableHead className="bg-muted/50 font-semibold">Name</TableHead>
            <TableHead className="bg-muted/50 font-semibold">Period</TableHead>
            <TableHead className="bg-muted/50 font-semibold text-right">Target</TableHead>
            <TableHead className="bg-muted/50 font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {targets.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{TYPE_LABELS[t.type]}</TableCell>
              <TableCell className="font-medium">{t.code}</TableCell>
              <TableCell>{t.name ?? '-'}</TableCell>
              <TableCell>
                {t.month ? `${MONTH_SHORT_LABELS[t.month]} ${t.year}` : `Yearly ${t.year}`}
              </TableCell>
              <TableCell className="text-right">{t.target}</TableCell>
              <TableCell>{t.isActive ? 'Active' : 'Inactive'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
