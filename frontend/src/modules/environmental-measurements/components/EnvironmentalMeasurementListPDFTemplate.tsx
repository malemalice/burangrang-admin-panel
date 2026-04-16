import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { EnvironmentalMeasurement } from '../types/environmental-measurement.types';
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
      <div className="text-[10px] text-muted-foreground mt-0.5">Regulatory limit: {limitText}</div>
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
    <div className="bg-white p-8 space-y-6">
      <div className="text-center border-b-2 border-foreground pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">
          Environmental Measurements
        </h1>
        <p className="text-sm text-muted-foreground">
          Export date: {format(new Date(), 'dd MMMM yyyy HH:mm')} — {measurements.length} record(s)
        </p>
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
