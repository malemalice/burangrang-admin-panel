import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePDF } from 'react-to-pdf';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Printer } from 'lucide-react';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Loader2 } from 'lucide-react';
import { weightReportService } from '../../services/wasteManagementService';
import { WeightReport } from '../../types/waste-management.types';
import { WeightReportPDFTemplate } from '../../components/WeightReportPDFTemplate';

export default function WeightReportDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<WeightReport | null>(null);
    const [loading, setLoading] = useState(true);
    const { toPDF, targetRef } = usePDF({ filename: `weight-report-${data?.reportCode || 'document'}.pdf` });

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const response = await weightReportService.getById(id);
                setData(response.data as WeightReport);
            } catch (error) {
                toast.error('Failed to fetch report details');
                navigate('/waste-management/weight-reports');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    useEffect(() => {
        if (searchParams.get('print') === 'true' && data) {
            setTimeout(() => {
                toPDF();
            }, 1000);
        }
    }, [searchParams, data, toPDF]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Solid Waste Report Details"
                subtitle={`Report Code: ${data.reportCode}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/waste-management/weight-reports')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                        </Button>
                        <Button variant="outline" onClick={() => toPDF()}>
                            <Printer className="mr-2 h-4 w-4" /> Export PDF
                        </Button>
                        <Button onClick={() => navigate(`/waste-management/weight-reports/${id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
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
            </div>

            {/* Hidden PDF Template */}
            <div className="absolute left-[-9999px] top-0" style={{ width: '210mm' }}>
                <div ref={targetRef}>
                    {data && <WeightReportPDFTemplate report={data} />}
                </div>
            </div>
        </div>
    );
}
