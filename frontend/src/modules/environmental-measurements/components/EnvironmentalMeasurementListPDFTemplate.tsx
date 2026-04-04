import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { EnvironmentalMeasurement } from '../types/environmental-measurement.types';
import type { EnvironmentalMeasurementRegulatoryLimits } from '../services/environmentalMeasurementService';

interface EnvironmentalMeasurementListPDFTemplateProps {
  measurements: EnvironmentalMeasurement[];
  regulatoryLimits?: EnvironmentalMeasurementRegulatoryLimits | null;
}

function MetricPdfCell({
  value,
  limit,
}: {
  value: number | undefined | null;
  limit: number | null | undefined;
}) {
  const limitText = limit != null && Number.isFinite(limit) ? String(limit) : '—';
  return (
    <div className="text-right">
      <div className="font-medium">{value ?? '—'}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">Regulatory limit: {limitText}</div>
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

      <Table>
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
                <MetricPdfCell value={m.lighting} limit={regulatoryLimits?.lighting} />
              </TableCell>
              <TableCell className="align-top">
                <MetricPdfCell value={m.noise} limit={regulatoryLimits?.noise} />
              </TableCell>
              <TableCell className="align-top">
                <MetricPdfCell value={m.humidity} limit={regulatoryLimits?.humidity} />
              </TableCell>
              <TableCell className="align-top">
                <MetricPdfCell value={m.temperature} limit={regulatoryLimits?.temperature} />
              </TableCell>
              <TableCell className="break-words whitespace-pre-wrap">{m.remarks ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
