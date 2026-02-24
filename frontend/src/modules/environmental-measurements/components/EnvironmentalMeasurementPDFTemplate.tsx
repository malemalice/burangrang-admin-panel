import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/core/components/ui/table';
import { EnvironmentalMeasurement } from '../types/environmental-measurement.types';

interface EnvironmentalMeasurementPDFTemplateProps {
  measurement: EnvironmentalMeasurement;
}

export function EnvironmentalMeasurementPDFTemplate({ measurement }: EnvironmentalMeasurementPDFTemplateProps) {
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
              <TableCell>{measurement.lighting ?? '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Noise (dB)</TableHead>
              <TableCell>{measurement.noise ?? '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Humidity (%)</TableHead>
              <TableCell>{measurement.humidity ?? '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Temperature (°C)</TableHead>
              <TableCell>{measurement.temperature ?? '-'}</TableCell>
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
