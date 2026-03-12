import { format } from 'date-fns';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/core/components/ui/table';
import { MonthlyFlowReport, ReportStatusEnum } from '../types/waste-management.types';

interface MonthlyFlowReportPDFTemplateProps {
  report: MonthlyFlowReport;
}

export function MonthlyFlowReportPDFTemplate({ report }: MonthlyFlowReportPDFTemplateProps) {
  const getStatusBadge = (status: ReportStatusEnum) => {
    return (
      <Badge variant={status === ReportStatusEnum.SUBMITTED ? 'default' : 'secondary'}>
        {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
      </Badge>
    );
  };

  return (
    <div
      className="bg-white p-8 space-y-6"
      style={{ width: '210mm', fontFamily: 'Arial, sans-serif' }}
      aria-hidden="true"
    >
      {/* Header Section */}
      <div className="text-center border-b-2 border-foreground pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">Monthly Flow Report</h1>
      </div>

      {/* Document Information */}
      <div className="mt-6 space-y-4">
        <Table>
          <TableBody>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Report Number</TableHead>
              <TableCell>{report.reportCode}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Treatment Plant</TableHead>
              <TableCell className="break-words">{report.treatmentPlant?.name || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Report Date</TableHead>
              <TableCell>
                {report.reportDate ? format(new Date(report.reportDate), 'dd MMMM yyyy') : '-'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Status</TableHead>
              <TableCell className="align-middle">{getStatusBadge(report.status)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Separator className="my-6" />

      {/* Flow Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold uppercase border-b border-border pb-2">Flow Data</h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Total Volume</TableHead>
              <TableCell className="font-semibold">
                {report.totalVolume.toLocaleString('en-US')} m³
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Average Daily Flow</TableHead>
              <TableCell>{report.averageDailyFlow.toLocaleString('en-US')} m³/day</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Peak Flow</TableHead>
              <TableCell>
                {report.peakFlow ? `${report.peakFlow.toLocaleString('en-US')} m³/day` : '-'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Minimum Flow</TableHead>
              <TableCell>
                {report.minimumFlow ? `${report.minimumFlow.toLocaleString('en-US')} m³/day` : '-'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Separator className="my-6" />

      {/* Personnel Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold uppercase border-b border-border pb-2">
          Prepared By
        </h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Submitted By</TableHead>
              <TableCell>
                {report.submitter
                  ? `${report.submitter.firstName} ${report.submitter.lastName}`
                  : 'N/A'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/3 bg-muted/50 font-semibold">Submitted At</TableHead>
              <TableCell>{format(new Date(report.submittedAt), 'dd MMMM yyyy, HH:mm')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Separator className="my-6" />

      {/* Signature Section */}
      <div className="mt-8 space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t-2 border-foreground mt-16 pt-2">
              <p className="text-sm font-semibold">Prepared By</p>
              <p className="text-xs text-muted-foreground mt-2">
                {report.submitter
                  ? `${report.submitter.firstName} ${report.submitter.lastName}`
                  : 'N/A'}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-foreground mt-16 pt-2">
              <p className="text-sm font-semibold">Approved By</p>
              <p className="text-xs text-muted-foreground mt-2">Manager / Reviewer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-border text-center text-xs text-muted-foreground">
        <p>Printed on: {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
        <p className="mt-1">Page 1 of 1</p>
      </div>
    </div>
  );
}
