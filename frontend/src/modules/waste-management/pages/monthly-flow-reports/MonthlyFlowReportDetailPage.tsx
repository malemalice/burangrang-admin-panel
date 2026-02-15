import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Calendar, FileText, Info, Droplets, ExternalLink, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';

import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import PageHeader from '@/core/components/ui/PageHeader';
import { monthlyFlowReportService } from '../../services/wasteManagementService';
import { MonthlyFlowReport, ReportStatusEnum } from '../../types/waste-management.types';
import { formatDate } from '@/core/utils/date';
import { MonthlyFlowReportPDFTemplate } from '../../components/MonthlyFlowReportPDFTemplate';

export default function MonthlyFlowReportDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<MonthlyFlowReport | null>(null);
    const [loading, setLoading] = useState(true);

    const { toPDF, targetRef } = usePDF({
        filename: data ? `monthly-flow-report-${data.reportCode}.pdf` : 'monthly-flow-report.pdf'
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const response = await monthlyFlowReportService.getById(id);
                setData(response.data);
            } catch (error) {
                toast.error('Failed to fetch report details');
                navigate('/waste-management/monthly-flow-reports');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    useEffect(() => {
        if (!loading && data && searchParams.get('print') === 'true') {
            const timer = setTimeout(() => {
                toPDF();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, data, searchParams, toPDF]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="absolute left-[-9999px] top-0">
                <div ref={targetRef}>
                    <MonthlyFlowReportPDFTemplate report={data} />
                </div>
            </div>

            <PageHeader
                title="Monthly Flow Report Details"
                subtitle={`Report ${data.reportCode}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/waste-management/monthly-flow-reports')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                        </Button>
                        <Button variant="outline" onClick={() => toPDF()}>
                            <FileText className="mr-2 h-4 w-4" /> Export PDF
                        </Button>
                        <Button onClick={() => navigate(`/waste-management/monthly-flow-reports/${id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Information */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            General Information
                        </CardTitle>
                        <CardDescription>Basic details about the monthly flow report</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Report Code</span>
                                <p className="font-medium text-lg font-mono">{data.reportCode}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Treatment Plant</span>
                                <p className="font-medium text-lg">{data.treatmentPlant?.name || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Report Date</span>
                                <p className="text-lg">
                                    <Badge variant="outline" className="text-base">
                                        {formatDate(data.reportDate || '')}
                                    </Badge>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                                <div>
                                    <Badge variant={data.status === ReportStatusEnum.SUBMITTED ? 'default' : 'secondary'}>
                                        {data.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Droplets className="h-4 w-4" /> Flow Data
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Total Volume</span>
                                    <p className="font-medium text-lg">{data.totalVolume?.toLocaleString()} m³</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Avg. Daily Flow</span>
                                    <p className="font-medium text-lg">{data.averageDailyFlow?.toLocaleString()} m³/day</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Peak Flow</span>
                                    <p className="font-medium text-lg">
                                        {data.peakFlow ? `${data.peakFlow.toLocaleString()} m³/day` : '-'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Minimum Flow</span>
                                    <p className="font-medium text-lg">
                                        {data.minimumFlow ? `${data.minimumFlow.toLocaleString()} m³/day` : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Document
                            </span>
                            <div className="space-y-2">
                                {data.reportDocumentUrl ? (
                                    <a
                                        href={data.reportDocumentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-primary hover:underline"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        View Document
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground italic">No document attached</span>
                                )}
                            </div>
                        </div>

                        {data.reviewNotes && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Activity className="h-4 w-4" /> Review Notes
                                    </span>
                                    <p className="whitespace-pre-wrap">
                                        {data.reviewNotes}
                                    </p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar Information */}
                <div className="space-y-6">
                    {/* Submission Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Submission Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Submitted By</span>
                                <p className="text-sm font-medium">
                                    {data.submitter ? `${data.submitter.firstName} ${data.submitter.lastName}` : 'Unknown'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Submitted At</span>
                                <p className="text-sm">{formatDate(data.submittedAt)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                System Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Created At</span>
                                <p className="text-sm">{formatDate(data.createdAt)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                <p className="text-sm">{formatDate(data.updatedAt)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Active Status</span>
                                <div>
                                    <Badge variant={data.isActive ? 'default' : 'secondary'}>
                                        {data.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
