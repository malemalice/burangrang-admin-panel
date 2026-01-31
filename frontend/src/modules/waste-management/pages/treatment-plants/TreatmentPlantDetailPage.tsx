import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Calendar, Info, MapPin, Building, Activity, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import PageHeader from '@/core/components/ui/PageHeader';
import { treatmentPlantService } from '../../services/wasteManagementService';
import { TreatmentPlant } from '../../types/waste-management.types';
import { formatDate } from '@/core/utils/date';

export default function TreatmentPlantDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<TreatmentPlant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const response = await treatmentPlantService.getById(id);
                setData(response.data);
            } catch (error) {
                toast.error('Failed to fetch treatment plant details');
                navigate('/waste-management/treatment-plants');
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
                title="Treatment Plant Details"
                subtitle={`Details for ${data.name}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/waste-management/treatment-plants')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                        </Button>
                        <Button onClick={() => navigate(`/waste-management/treatment-plants/${id}/edit`)}>
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
                        <CardDescription>Basic details about the treatment plant</CardDescription>
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
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> Location
                                </span>
                                <p>{data.location}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4" /> Capacity
                                </span>
                                <p>{data.capacity?.toLocaleString() || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Building className="h-4 w-4" /> Office
                                </span>
                                <p>{data.office?.name || '-'}</p>
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
                            {data.creator && (
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground">Created By</span>
                                    <p className="text-sm">{data.creator.firstName} {data.creator.lastName}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
