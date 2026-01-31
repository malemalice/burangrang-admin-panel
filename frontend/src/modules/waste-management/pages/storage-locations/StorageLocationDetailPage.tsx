import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Pencil, ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';

import { storageLocationService } from '../../services/wasteManagementService';
import { StorageLocation } from '../../types/waste-management.types';

export default function StorageLocationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [storageLocation, setStorageLocation] = useState<StorageLocation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!id) return;
                const response = await storageLocationService.getById(id);
                const data = response.data as StorageLocation;
                setStorageLocation(data);
            } catch (error) {
                toast.error('Failed to fetch storage location');
                navigate('/waste-management/storage-locations');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!storageLocation) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/waste-management/storage-locations')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to List
                </Button>
                <Button onClick={() => navigate(`/waste-management/storage-locations/${id}/edit`)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Location
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{storageLocation.name}</CardTitle>
                            <CardDescription className="mt-1">
                                Code: {storageLocation.code}
                            </CardDescription>
                        </div>
                        <Badge variant={storageLocation.isActive ? 'default' : 'secondary'}>
                            {storageLocation.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Location</p>
                            <p>{storageLocation.location}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Area</p>
                            <p>{storageLocation.area?.name || '-'}</p>
                        </div>
                    </div>

                    {storageLocation.description && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Description</p>
                            <p>
                                {storageLocation.description}
                            </p>
                        </div>
                    )}

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Created By</p>
                            <p>
                                {storageLocation.creator
                                    ? `${storageLocation.creator.firstName} ${storageLocation.creator.lastName}`
                                    : '-'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Created At</p>
                            <p>{format(new Date(storageLocation.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                            <p>{format(new Date(storageLocation.updatedAt), 'dd MMM yyyy, HH:mm')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
