import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type { MonthlyIncidentData } from '../types/security-team.types';

interface IncidentsByMonthTableProps {
  data: MonthlyIncidentData[];
}

function getRowBgClass(category: string): string {
  if (category === 'Minor') return 'bg-yellow-100 dark:bg-yellow-900/30';
  if (category === 'Moderate') return 'bg-orange-100 dark:bg-orange-900/30';
  if (category === 'Major') return 'bg-red-100 dark:bg-red-900/30';
  return 'font-semibold';
}

export function IncidentsByMonthTable({ data }: IncidentsByMonthTableProps) {
  const months = data[0]?.months.map((m) => m.month) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Numbers of Incidents Per Month</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] sticky left-0 bg-background">Category</TableHead>
                {months.map((m) => (
                  <TableHead key={m} className="text-right min-w-[80px]">
                    {m}
                  </TableHead>
                ))}
                <TableHead className="text-right font-semibold min-w-[60px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className={`font-medium sticky left-0 bg-background ${getRowBgClass(row.category)}`}>
                    {row.category}
                  </TableCell>
                  {row.months.map((m) => (
                    <TableCell key={m.month} className={`text-right ${getRowBgClass(row.category)}`}>
                      {m.count}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-semibold ${getRowBgClass(row.category)}`}>
                    {row.total}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
