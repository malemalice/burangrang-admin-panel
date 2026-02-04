import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type { IncidentSummary } from '../types/hazard-analytics.types';

interface IncidentSummaryCardProps {
  data: IncidentSummary[];
}

export function IncidentSummaryCard({ data }: IncidentSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Incident Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Category</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Target / Difference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.category}>
                <TableCell className="font-medium">{row.category}</TableCell>
                <TableCell className="text-right">{row.actual}</TableCell>
                <TableCell className="text-right">{row.target}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
