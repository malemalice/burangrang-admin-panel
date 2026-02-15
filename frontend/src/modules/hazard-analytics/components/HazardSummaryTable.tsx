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
  HazardTypeData,
  NonConformanceCriteria,
  ResponsibleAction,
  HazardStatus,
} from '../types/hazard-analytics.types';

interface HazardSummaryTableProps {
  hazardTypes: HazardTypeData[];
  nonConformanceCriteria: NonConformanceCriteria[];
  responsibleActions: ResponsibleAction[];
  hazardStatus: HazardStatus;
}

export function HazardSummaryTable({
  hazardTypes,
  nonConformanceCriteria,
  responsibleActions,
  hazardStatus,
}: HazardSummaryTableProps) {
  const hazardTypesTotal = hazardTypes.reduce((sum, h) => sum + h.count, 0);
  const nonConformanceTotal = nonConformanceCriteria.reduce((sum, n) => sum + n.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Hazard and Non-Conformance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-sm mb-2">Responsible Action</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right w-20">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responsibleActions.map((row) => (
                  <TableRow key={row.action}>
                    <TableCell className="font-medium">{row.action}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Non Conformance Criteria</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criteria</TableHead>
                  <TableHead className="text-right w-20">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonConformanceCriteria.map((row) => (
                  <TableRow key={row.criteria}>
                    <TableCell className="font-medium">{row.criteria}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell>Total Non Conformance Criteria</TableCell>
                  <TableCell className="text-right">{nonConformanceTotal}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Type of Hazard</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right w-20">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hazardTypes.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell>Total Type of Hazard</TableCell>
                  <TableCell className="text-right">{hazardTypesTotal}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Status</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-20">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      Open
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{hazardStatus.open}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                      Closed
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{hazardStatus.closed}</TableCell>
                </TableRow>
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell>Total Open and Close Case</TableCell>
                  <TableCell className="text-right">{hazardStatus.total}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
