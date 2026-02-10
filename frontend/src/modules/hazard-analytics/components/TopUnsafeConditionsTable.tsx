import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type { TopUnsafeCondition } from '../types/hazard-analytics.types';

interface TopUnsafeConditionsTableProps {
  data: TopUnsafeCondition[];
}

export function TopUnsafeConditionsTable({ data }: TopUnsafeConditionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top 10 Unsafe Condition</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Top 10 Unsafe Condition</TableHead>
              <TableHead className="text-right w-24">Report</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.rank}>
                <TableCell className="font-medium">{row.rank}</TableCell>
                <TableCell>{row.condition}</TableCell>
                <TableCell className="text-right">{row.reportCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
