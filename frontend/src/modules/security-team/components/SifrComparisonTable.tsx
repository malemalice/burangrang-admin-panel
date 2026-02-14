import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type { SifrComparisonRow } from '../types/security-team.types';

interface SifrComparisonTableProps {
  data: SifrComparisonRow[];
}

export function SifrComparisonTable({ data }: SifrComparisonTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">SIFR Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">YEAR</TableHead>
                <TableHead className="text-right bg-green-100 dark:bg-green-900/30 min-w-[100px]">
                  Total SIFR
                </TableHead>
                <TableHead className="text-right bg-red-100 dark:bg-red-900/30 min-w-[100px]">
                  Total Major Incident rate
                </TableHead>
                <TableHead className="text-right bg-orange-100 dark:bg-orange-900/30 min-w-[100px]">
                  Total Moderate Incident rate
                </TableHead>
                <TableHead className="text-right bg-yellow-100 dark:bg-yellow-900/30 min-w-[100px]">
                  Total Minor Incident rate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.year}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className="text-right bg-green-100 dark:bg-green-900/30">
                    {row.totalSifr.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right bg-red-100 dark:bg-red-900/30">
                    {row.majorRate.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right bg-orange-100 dark:bg-orange-900/30">
                    {row.moderateRate.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right bg-yellow-100 dark:bg-yellow-900/30">
                    {row.minorRate.toFixed(2)}
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
