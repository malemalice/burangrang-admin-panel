import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type { MonthlyHazardData } from '../types/hazard-analytics.types';

interface HazardsByMonthTableProps {
  data: MonthlyHazardData[];
}

export function HazardsByMonthTable({ data }: HazardsByMonthTableProps) {
  const months = data[0]?.months.map((m) => m.month) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Numbers of Hazard Per Month</CardTitle>
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
                  <TableCell className="font-medium sticky left-0 bg-background">
                    {row.category}
                  </TableCell>
                  {row.months.map((m) => (
                    <TableCell key={m.month} className="text-right">
                      {m.count}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
