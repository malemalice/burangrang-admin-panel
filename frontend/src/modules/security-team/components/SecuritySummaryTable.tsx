import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type {
  TypeNonConformanceItem,
  PartiesInvolvedItem,
  CaseStatus,
} from '../types/security-team.types';

interface SecuritySummaryTableProps {
  typeNonConformance: TypeNonConformanceItem[];
  partiesInvolved: PartiesInvolvedItem[];
  caseStatus: CaseStatus;
}

export function SecuritySummaryTable({
  typeNonConformance,
  partiesInvolved,
  caseStatus,
}: SecuritySummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Security Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
              Incident Category
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Category</TableHead>
                  <TableHead className="text-right w-[80px]">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeNonConformance.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="text-sm">{row.type}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
              Parties Involved
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Party</TableHead>
                  <TableHead className="text-right w-[80px]">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partiesInvolved.map((row) => (
                  <TableRow key={row.party}>
                    <TableCell className="text-sm">{row.party}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 bg-muted px-2 py-1 rounded">Status</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[80px]">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-sm bg-yellow-100 dark:bg-yellow-900/30">Open</TableCell>
                  <TableCell className="text-right">{caseStatus.open}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm bg-green-100 dark:bg-green-900/30">Closed</TableCell>
                  <TableCell className="text-right">{caseStatus.closed}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-medium">Total Open and Close Case</TableCell>
                  <TableCell className="text-right font-medium">{caseStatus.total}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
