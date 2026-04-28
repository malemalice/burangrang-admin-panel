import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Award, Building2, FileText, Loader2, Mail } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import certificateCategoryService from '../services/certificateCategoryService';
import { CertificateCategory, CertificateType } from '../types/certificate.types';
import { usePermissions } from '@/core/hooks/usePermissions';

const certificateTypeLabels: Record<CertificateType, string> = {
    PERSONNEL_LICENSE: 'Personnel License',
    PERSONNEL_CERTIFICATE: 'Personnel Certificate',
    EQUIPMENT_CALIBRATION: 'Equipment Calibration',
    EQUIPMENT_INSTALLATION: 'Equipment Installation',
    EQUIPMENT_OPERATIONAL_PERMIT: 'Equipment Operational Permit',
};

const CertificateCategoryDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [category, setCategory] = useState<CertificateCategory | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                if (!id) return;
                const data = await certificateCategoryService.getCategoryById(id);
                setCategory(data);
            } catch (error: unknown) {
                console.error('Failed to fetch certificate category:', error);
                const errorMessage =
                    error instanceof Error ? error.message : 'Failed to fetch certificate category';
                toast.error(errorMessage);
                navigate('/master/certificate-categories');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategory();
    }, [id, navigate]);

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading category details...</span>
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Category not found</h2>
                <p className="text-gray-600 mb-4">
                    The category you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
                <Button onClick={() => navigate('/master/certificate-categories')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Categories
                </Button>
            </div>
        );
    }

    const canEdit = hasPermission('certificate-category:update');

    return (
        <>
            <PageHeader
                title={category.name}
                subtitle={`Code: ${category.code}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => navigate('/master/certificate-categories')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        {canEdit && (
                            <Button onClick={() => navigate(`/master/certificate-categories/${category.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Award className="h-5 w-5" />
                                Basic information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{category.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Code</p>
                                <p className="font-medium">{category.code}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Certificate type</p>
                                <p className="font-medium">
                                    {certificateTypeLabels[category.certificateType] ||
                                        category.certificateType}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge
                                    variant="outline"
                                    className={
                                        category.isActive
                                            ? 'bg-green-100 text-green-800 border-0'
                                            : 'bg-gray-100 text-gray-800 border-0'
                                    }
                                >
                                    {category.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Building2 className="h-5 w-5" />
                                Responsible departments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(category.responsibleDepartments?.length ?? 0) > 0 ? (
                                <ul className="space-y-4">
                                    {category.responsibleDepartments.map((d) => {
                                        const emails = d.emails?.filter(Boolean) ?? [];
                                        return (
                                            <li key={d.id} className="text-sm border-b border-border pb-4 last:border-0 last:pb-0">
                                                <p className="font-medium">{d.name}</p>
                                                <div className="mt-2 flex gap-2">
                                                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                                                    <div className="space-y-1 min-w-0">
                                                        <p className="text-xs text-muted-foreground">
                                                            Notification email addresses
                                                        </p>
                                                        {emails.length > 0 ? (
                                                            <ul className="space-y-1">
                                                                {emails.map((email) => (
                                                                    <li key={email}>
                                                                        <a
                                                                            href={`mailto:${email}`}
                                                                            className="text-primary hover:underline break-all"
                                                                        >
                                                                            {email}
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-muted-foreground text-xs">
                                                                No notification emails configured for this department
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No departments assigned</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-3">
                                Departments notified by email when a certificate under this category is
                                approaching expiry.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-5 w-5" />
                            Description
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">
                            {category.description?.trim() ? category.description : 'No description'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Created</p>
                                <p className="font-medium">{formatDateTime(category.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Last updated</p>
                                <p className="font-medium">{formatDateTime(category.updatedAt)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default CertificateCategoryDetailPage;
