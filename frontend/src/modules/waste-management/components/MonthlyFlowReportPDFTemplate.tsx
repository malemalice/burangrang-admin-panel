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
        <div className="bg-white p-8 space-y-6">
            {/* Header Section */}
            <div className="text-center border-b-2 border-foreground pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">
                    Laporan Aliran Limbah Cair
                </h1>
                <p className="text-sm text-muted-foreground">MONTHLY FLOW REPORT</p>
            </div>

            {/* Document Information */}
            <div className="mt-6 space-y-4">
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Nomor Laporan</TableHead>
                            <TableCell>{report.reportCode}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Treatment Plant</TableHead>
                            <TableCell>{report.treatmentPlant?.name || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Tanggal Laporan</TableHead>
                            <TableCell>{report.reportDate ? format(new Date(report.reportDate), 'dd MMMM yyyy') : '-'}</TableCell>
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
                <h2 className="text-xl font-semibold uppercase border-b border-border pb-2">
                    Data Aliran
                </h2>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Total Volume</TableHead>
                            <TableCell className="font-semibold">{report.totalVolume.toLocaleString('id-ID')} m³</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Rata-rata Harian</TableHead>
                            <TableCell>{report.averageDailyFlow.toLocaleString('id-ID')} m³/hari</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Peak Flow</TableHead>
                            <TableCell>{report.peakFlow ? `${report.peakFlow.toLocaleString('id-ID')} m³/hari` : '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Minimum Flow</TableHead>
                            <TableCell>{report.minimumFlow ? `${report.minimumFlow.toLocaleString('id-ID')} m³/hari` : '-'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <Separator className="my-6" />

            {/* Personnel Information */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold uppercase border-b border-border pb-2">
                    Informasi Pembuat
                </h2>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Dibuat Oleh</TableHead>
                            <TableCell>
                                {report.submitter
                                    ? `${report.submitter.firstName} ${report.submitter.lastName}`
                                    : 'N/A'}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Tanggal Submit</TableHead>
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
                            <p className="text-sm font-semibold">Dibuat Oleh</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {report.submitter
                                    ? `${report.submitter.firstName} ${report.submitter.lastName}`
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="border-t-2 border-foreground mt-16 pt-2">
                            <p className="text-sm font-semibold">Diketahui Oleh</p>
                            <p className="text-xs text-muted-foreground mt-2">Manager / Reviewer</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-border text-center text-xs text-muted-foreground">
                <p>Dokumen ini dicetak pada: {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
                <p className="mt-1">Halaman 1 dari 1</p>
            </div>
        </div>
    );
}
