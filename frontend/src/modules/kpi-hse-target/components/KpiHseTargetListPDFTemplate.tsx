import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { HseTarget, TYPE_LABELS, MONTH_SHORT_LABELS } from '../types/kpi-hse-target.types';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';

interface KpiHseTargetListPDFTemplateProps {
  targets: HseTarget[];
}

export function KpiHseTargetListPDFTemplate({ targets }: KpiHseTargetListPDFTemplateProps) {
  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">KPI HSE Target List</h1>
            <p className="text-sm text-gray-600 mb-1">{targets.length} record(s)</p>
            <p className="text-sm text-gray-600">Generated on {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
          </div>
          <div className="shrink-0">
            <PdfAppHeader />
          </div>
        </div>
      </div>

      <Table data-pdf-table-splittable="">
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
