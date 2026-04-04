import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/core/components/ui/table';
import { EnvironmentalMeasurement } from '../types/environmental-measurement.types';
import type { EnvironmentalMeasurementRegulatoryLimits, MetricRegulatoryLimit } from '../services/environmentalMeasurementService';
import type { RegulatoryMetricKey } from '../utils/regulatoryLimitComparison';
import {
  compareToRegulatoryLimit,
  formatRegulatoryComparisonText,
  getRegulatoryLimitMode,
} from '../utils/regulatoryLimitComparison';

interface EnvironmentalMeasurementPDFTemplateProps {
  measurement: EnvironmentalMeasurement;
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
    <div>
      <div className="font-medium">{value ?? '—'}</div>
      <div className="text-xs text-muted-foreground mt-1">Regulatory limit: {limitText}</div>
      {comparisonText && (
        <div className="text-xs mt-1 font-medium">
          {comparisonText}
        </div>
      )}
    </div>
  );
}

export function EnvironmentalMeasurementPDFTemplate({
  measurement,
  regulatoryLimits,
}: EnvironmentalMeasurementPDFTemplateProps) {
  const roomLabel = measurement.room
    ? `${measurement.room.name} (${measurement.room.code})`
    : '-';

  return (
    <div className="bg-white p-8 space-y-6">
      <div className="text-center border-b-2 border-foreground pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">
          Environmental Measurement
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(measurement.date), 'dd MMMM yyyy')}
        </p>
      </div>

      <div className="space-y-4">
        <Table>
          <TableBody>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Date</TableHead>
              <TableCell>{format(new Date(measurement.date), 'dd MMM yyyy')}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Room</TableHead>
              <TableCell>{roomLabel}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Lighting (lux)</TableHead>
              <TableCell>
                <MetricPdfCell metric="lighting" value={measurement.lighting} limitEntry={regulatoryLimits?.lighting} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Noise (dB)</TableHead>
              <TableCell>
                <MetricPdfCell metric="noise" value={measurement.noise} limitEntry={regulatoryLimits?.noise} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Humidity (%)</TableHead>
              <TableCell>
                <MetricPdfCell metric="humidity" value={measurement.humidity} limitEntry={regulatoryLimits?.humidity} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Temperature (°C)</TableHead>
              <TableCell>
                <MetricPdfCell metric="temperature" value={measurement.temperature} limitEntry={regulatoryLimits?.temperature} />
              </TableCell>
            </TableRow>
            {measurement.remarks && (
              <TableRow>
                <TableHead className="w-1/3 bg-muted/50 font-semibold">Remarks</TableHead>
                <TableCell className="whitespace-pre-wrap">{measurement.remarks}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {measurement.creator && (
        <div className="pt-4 border-t border-border text-sm text-muted-foreground">
          Recorded by: {measurement.creator.firstName} {measurement.creator.lastName}
        </div>
      )}
    </div>
  );
}
