import { format } from 'date-fns';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/core/components/ui/table';
import { WeightReport, WeightReportStatusEnum } from '../types/waste-management.types';

interface WeightReportPDFTemplateProps {
    report: WeightReport;
}

export function WeightReportPDFTemplate({ report }: WeightReportPDFTemplateProps) {
    const getStatusBadge = (status: WeightReportStatusEnum) => {
        return (
            <Badge variant={status === WeightReportStatusEnum.DONE ? 'default' : 'secondary'}>
                {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
        );
    };

    return (
        <div className="bg-white p-8 space-y-6">
            {/* Header Section */}
            <div className="text-center border-b-2 border-foreground pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">
                    Laporan Timbangan Limbah Padat
                </h1>
                <p className="text-sm text-muted-foreground">SOLID WASTE WEIGHT REPORT</p>
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
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Sumber Limbah</TableHead>
                            <TableCell className="break-words">{report.source?.name || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Lokasi Penyimpanan</TableHead>
                            <TableCell className="break-words">{report.storageLocation?.name || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Tanggal Laporan</TableHead>
                            <TableCell>{report.reportDate ? format(new Date(report.reportDate), 'dd MMMM yyyy') : '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-1/3 bg-muted/50 font-semibold">Status</TableHead>
                            <TableCell className="align-middle">{report.status}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <Separator className="my-6" />

            {/* Items Details */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold uppercase border-b border-border pb-2">
                    Detail Item Limbah
                </h2>
                <Table>
                    <TableBody>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Jenis Limbah</TableHead>
                            <TableHead className="font-semibold text-right">Berat</TableHead>
                            <TableHead className="font-semibold">Satuan</TableHead>
                            <TableHead className="font-semibold">Catatan</TableHead>
                        </TableRow>
                        {report.items && report.items.length > 0 ? (
                            report.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="break-words">{item.wasteType?.name || '-'}</TableCell>
                                    <TableCell className="text-right">{item.weight.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell className="break-words whitespace-pre-wrap">{item.notes || '-'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    Tidak ada data item
                                </TableCell>
                            </TableRow>
                        )}
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
