import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Calendar, FileText, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import PageHeader from '@/core/components/ui/PageHeader';
import { wasteTypeService } from '../../services/wasteManagementService';
import { WasteType } from '../../types/waste-management.types';
import { formatDate } from '@/core/utils/date';

export default function WasteTypeDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<WasteType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const response = await wasteTypeService.getById(id);
                setData(response.data);
            } catch (error) {
                toast.error('Failed to fetch waste type details');
                navigate('/waste-management/waste-types');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

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
            <PageHeader
                title="Waste Type Details"
                subtitle={`Details for ${data.name}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/waste-management/waste-types')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                        </Button>
                        <Button onClick={() => navigate(`/waste-management/waste-types/${id}/edit`)}>
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
                        <CardDescription>Basic details about the waste type classification</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Name</span>
                                <p className="font-medium text-lg">{data.name}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Code</span>
                                <p className="font-medium text-lg font-mono">{data.code}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Category</span>
                                <p>
                                    <Badge variant="outline" className="text-base">
                                        {data.wasteType}
                                    </Badge>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                                <div>
                                    <Badge variant={data.isActive ? 'default' : 'secondary'}>
                                        {data.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Handling Requirements
                            </span>
                            <div className="flex items-center gap-2">
                                {data.requiresSpecialHandling ? (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Requires Special Handling
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground">Standard handling procedures apply</span>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Description
                            </span>
                            <p className="whitespace-pre-wrap">
                                {data.description || <span className="text-muted-foreground italic">No description provided</span>}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Information */}
                <div className="space-y-6">
                    {/* System Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
