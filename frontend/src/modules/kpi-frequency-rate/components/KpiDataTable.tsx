import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import type { KpiDataPoint } from '../types/kpi-frequency-rate.types';

const STUDY_CLASS = 'bg-blue-500/90 text-white font-medium';
const WORK_CLASS = 'bg-red-500/90 text-white font-medium';
const TOTAL_CLASS = 'bg-green-500/90 text-white font-medium';

interface KpiDataTableProps {
  title: string;
  data: KpiDataPoint[];
  studyLabel: string;
  workLabel: string;
  totalLabel: string;
  highlightLastRow?: boolean;
  formatValue?: (v: number) => string;
}

const defaultFormat = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));

export function KpiDataTable({
  title,
  data,
  studyLabel,
  workLabel,
  totalLabel,
  highlightLastRow = true,
  formatValue = defaultFormat,
}: KpiDataTableProps) {
  const lastIndex = data.length - 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>YEAR</TableHead>
              <TableHead>{studyLabel}</TableHead>
              <TableHead>{workLabel}</TableHead>
              <TableHead>{totalLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => {
              const isLast = highlightLastRow && idx === lastIndex;
              return (
                <TableRow key={row.year}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className={isLast ? STUDY_CLASS : ''}>
                    {formatValue(row.studyRelated)}
                  </TableCell>
                  <TableCell className={isLast ? WORK_CLASS : ''}>
                    {formatValue(row.workRelated)}
                  </TableCell>
                  <TableCell className={isLast ? TOTAL_CLASS : ''}>
                    {formatValue(row.total)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
