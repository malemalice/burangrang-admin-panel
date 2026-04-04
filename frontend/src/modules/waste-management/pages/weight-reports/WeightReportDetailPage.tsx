import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePDF } from 'react-to-pdf';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Pencil,
    Printer,
    Send,
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { ApprovalStatus } from '@/core/lib/types';
import approvalService, { type ApprovalStatusHistory } from '@/modules/master-data/services/approvalService';
import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entity.constants';
import { weightReportService } from '../../services/wasteManagementService';
import { WeightReport, WeightReportStatusEnum } from '../../types/waste-management.types';
import { WeightReportPDFTemplate } from '../../components/WeightReportPDFTemplate';
import { ApprovalDialog } from '../../components/ApprovalDialog';
import { ApprovalTimelineCard } from '@/modules/risk-assessment/components/ApprovalTimelineCard';

function getStatusBadge(status?: string) {
    switch (status) {
        case WeightReportStatusEnum.DRAFT:
            return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Draft</Badge>;
        case WeightReportStatusEnum.OPEN:
            return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Open</Badge>;
        case WeightReportStatusEnum.WAITING_APPROVAL:
            return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Waiting Approval</Badge>;
        case WeightReportStatusEnum.DONE:
            return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Done</Badge>;
        case WeightReportStatusEnum.REJECTED:
            return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
        default:
            return status ? <Badge variant="outline">{status}</Badge> : null;
    }
}

export default function WeightReportDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<WeightReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const [approvalHistory, setApprovalHistory] = useState<ApprovalStatusHistory | null>(null);
    const [canApprove, setCanApprove] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [approvalInitialStatus, setApprovalInitialStatus] = useState<ApprovalStatus>(ApprovalStatus.APPROVED);

    const { toPDF, targetRef } = usePDF({ filename: `weight-report-${data?.reportCode || 'document'}.pdf` });

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const response = await weightReportService.getById(id);
            setData(response.data as WeightReport);
        } catch {
            toast.error('Failed to fetch report details');
            navigate('/waste-management/weight-reports');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    const fetchApprovalData = useCallback(async (reportId: string) => {
        setIsLoadingHistory(true);
        try {
            const [historyResult, rightsResult] = await Promise.allSettled([
                approvalService.checkApprovalStatus(reportId, APPROVAL_ENTITIES.WEIGHT_REPORT),
                approvalService.checkApprovalRights(reportId, APPROVAL_ENTITIES.WEIGHT_REPORT),
            ]);

            if (historyResult.status === 'fulfilled') {
                setApprovalHistory(historyResult.value);
            }
            if (rightsResult.status === 'fulfilled') {
                setCanApprove(!!rightsResult.value?.canApprove);
            }
        } catch {
            // approval data is non-critical
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!id || !data) return;
        fetchApprovalData(id);
    }, [id, data?.id, fetchApprovalData]);

    useEffect(() => {
        if (searchParams.get('print') === 'true' && data) {
            setTimeout(() => {
                toPDF();
            }, 1000);
        }
    }, [searchParams, data, toPDF]);

    const handleRefresh = useCallback(async () => {
        await fetchData();
        if (id) await fetchApprovalData(id);
    }, [fetchData, fetchApprovalData, id]);

    const handleSubmit = async () => {
        if (!id) return;
        try {
            setIsUpdatingStatus(true);
            const response = await weightReportService.submit(id);
            setData(response.data as WeightReport);
            toast.success('Report submitted successfully');
        } catch {
            toast.error('Failed to submit report');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleRequestApproval = async () => {
        if (!id) return;
        try {
            setIsUpdatingStatus(true);
            const response = await weightReportService.requestApproval(id);
            setData(response.data as WeightReport);
            await fetchApprovalData(id);
            toast.success('Approval requested successfully');
        } catch {
            toast.error('Failed to request approval');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const openApproveDialog = () => {
        setApprovalInitialStatus(ApprovalStatus.APPROVED);
        setIsApprovalModalOpen(true);
    };

    const openRejectDialog = () => {
        setApprovalInitialStatus(ApprovalStatus.REJECTED);
        setIsApprovalModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    const isEditable = data.status === WeightReportStatusEnum.DRAFT || data.status === WeightReportStatusEnum.OPEN;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Solid Waste Report Details"
                subtitle={`Report Code: ${data.reportCode}`}
                actions={
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" onClick={() => navigate('/waste-management/weight-reports')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                        </Button>
                        <Button variant="outline" onClick={() => toPDF()}>
                            <Printer className="mr-2 h-4 w-4" /> Export PDF
                        </Button>
                        {isEditable && (
                            <Button variant="outline" onClick={() => navigate(`/waste-management/weight-reports/${id}/edit`)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        )}
                        {data.status === WeightReportStatusEnum.DRAFT && (
                            <Button onClick={handleSubmit} disabled={isUpdatingStatus}>
                                <Send className="mr-2 h-4 w-4" />
                                {isUpdatingStatus ? 'Submitting...' : 'Submit'}
                            </Button>
                        )}
                        {data.status === WeightReportStatusEnum.OPEN && (
                            <Button onClick={handleRequestApproval} disabled={isUpdatingStatus}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                {isUpdatingStatus ? 'Requesting...' : 'Request Approval'}
                            </Button>
                        )}
                        {data.status === WeightReportStatusEnum.WAITING_APPROVAL && canApprove && (
                            <>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={openApproveDialog}
                                    disabled={isLoadingHistory}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                                </Button>
                                <Button variant="destructive" onClick={openRejectDialog} disabled={isLoadingHistory}>
                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                </Button>
                            </>
                        )}
                    </div>
                }
            />

            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Report Information</CardTitle>
                        <CardDescription>Basic details about the weight report</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Report Code</p>
                            <p className="font-medium">{data.reportCode}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="mt-1">{getStatusBadge(data.status)}</div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Source</p>
                            <p className="font-medium">{data.source?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Storage Location</p>
                            <p className="font-medium">{data.storageLocation?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Period</p>
                            <p className="font-medium">{data.reportMonth} {data.reportYear}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Report Date</p>
                            <p className="font-medium">{new Date(data.reportDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Submitted At</p>
                            <p className="font-medium">{new Date(data.submittedAt).toLocaleDateString()}</p>
                        </div>
                        {data.reportDocumentUrl && (
                            <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground">Document URL</p>
                                <a href={data.reportDocumentUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                                    {data.reportDocumentUrl}
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {data.items && data.items.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Waste Items</CardTitle>
                            <CardDescription>Waste types and their weights</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Waste Type</TableHead>
                                        <TableHead className="w-32">Weight</TableHead>
                                        <TableHead className="w-24">Unit</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.items.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>{item.wasteType?.name || '-'}</TableCell>
                                            <TableCell>{item.weight}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell>{item.notes || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="pt-6">
                        <ApprovalTimelineCard
                            approvalHistory={approvalHistory}
                            isLoading={isLoadingHistory}
                            assessmentStatus={data.status}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Hidden PDF Template */}
            <div className="absolute left-[-9999px] top-0" style={{ width: '210mm' }}>
                <div ref={targetRef}>
                    {data && <WeightReportPDFTemplate report={data} />}
                </div>
            </div>

            <ApprovalDialog
                open={isApprovalModalOpen}
                onOpenChange={setIsApprovalModalOpen}
                weightReportId={id!}
                onApprovalSubmitted={handleRefresh}
                initialStatus={approvalInitialStatus}
            />
        </div>
    );
}
