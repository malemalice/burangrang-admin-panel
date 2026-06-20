import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { EnvironmentalMeasurement } from '../types/environmental-measurement.types';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';
import type { EnvironmentalMeasurementRegulatoryLimits, MetricRegulatoryLimit } from '../services/environmentalMeasurementService';
import type { RegulatoryMetricKey } from '../utils/regulatoryLimitComparison';
import {
  compareToRegulatoryLimit,
  formatRegulatoryComparisonText,
  getRegulatoryLimitMode,
} from '../utils/regulatoryLimitComparison';

interface EnvironmentalMeasurementListPDFTemplateProps {
  measurements: EnvironmentalMeasurement[];
  regulatoryLimits?: EnvironmentalMeasurementRegulatoryLimits | null;
}

function MetricPdfCell({
  metric,
  value,
  limitEntry,
}: {
  metric: RegulatoryMetricKey;
  value: number | undefined | null;
  limitEntry?: MetricRegulatoryLimit | null;
}) {
  const limit = limitEntry?.limit ?? null;
  const mode = limitEntry?.mode ?? getRegulatoryLimitMode(metric);
  const limitText = limit != null && Number.isFinite(limit) ? String(limit) : '—';
  const comparisonText = formatRegulatoryComparisonText(value, limit, mode);
  const { compliant } = compareToRegulatoryLimit(value, limit, mode);
  

  return (
    <div className="text-right">
      <div className="font-medium">{value ?? '—'}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">Quality Standard Value: {limitText}</div>
      {comparisonText && (
        <div className="text-[10px] text-foreground mt-0.5 font-medium">
          {comparisonText}
        </div>
      )}
    </div>
  );
}

export function EnvironmentalMeasurementListPDFTemplate({
  measurements,
  regulatoryLimits,
}: EnvironmentalMeasurementListPDFTemplateProps) {
  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Non Water Monitoring List</h1>
            <p className="text-sm text-gray-600 mb-1">{measurements.length} record(s)</p>
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
            <TableHead className="bg-muted/50 font-semibold">Date</TableHead>
            <TableHead className="bg-muted/50 font-semibold">Room</TableHead>
            <TableHead className="bg-muted/50 font-semibold text-right">Lighting (lux)</TableHead>
            <TableHead className="bg-muted/50 font-semibold text-right">Noise (dB)</TableHead>
            <TableHead className="bg-muted/50 font-semibold text-right">Humidity (%)</TableHead>
            <TableHead className="bg-muted/50 font-semibold text-right">Temp (°C)</TableHead>
            <TableHead className="bg-muted/50 font-semibold">Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {measurements.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{format(new Date(m.date), 'dd MMM yyyy')}</TableCell>
              <TableCell>
                {m.room ? (
                  <div>
                    <div className="font-medium">{m.room.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Code: {m.room.code}</div>
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="align-top">
                <MetricPdfCell metric="lighting" value={m.lighting} limitEntry={regulatoryLimits?.lighting} />
              </TableCell>
              <TableCell className="align-top">
                <MetricPdfCell metric="noise" value={m.noise} limitEntry={regulatoryLimits?.noise} />
              </TableCell>
              <TableCell className="align-top">
                <MetricPdfCell metric="humidity" value={m.humidity} limitEntry={regulatoryLimits?.humidity} />
              </TableCell>
              <TableCell className="align-top">
                <MetricPdfCell metric="temperature" value={m.temperature} limitEntry={regulatoryLimits?.temperature} />
              </TableCell>
              <TableCell className="break-words whitespace-pre-wrap">{m.remarks ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
