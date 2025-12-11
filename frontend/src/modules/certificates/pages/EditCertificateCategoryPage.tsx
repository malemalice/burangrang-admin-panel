import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import CertificateCategoryForm from './CertificateCategoryForm';
import certificateCategoryService from '../services/certificateCategoryService';
import { CertificateCategory } from '../types/certificate.types';

const EditCertificateCategoryPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [category, setCategory] = useState<CertificateCategory | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                if (!id) return;
                const data = await certificateCategoryService.getCategoryById(id);
                setCategory(data);
            } catch (error: any) {
                console.error('Failed to fetch certificate category:', error);
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Failed to fetch certificate category';
                toast.error(errorMessage);
                navigate('/master/certificate-categories');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategory();
    }, [id, navigate]);

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
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Category not found
                </h2>
                <p className="text-gray-600 mb-4">
                    The category you're looking for doesn't exist or has been deleted.
                </p>
                <Button onClick={() => navigate('/master/certificate-categories')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Categories
                </Button>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Edit Certificate Category"
                subtitle={`Modify the details of "${category.name}"`}
                actions={
                    <Button variant="outline" onClick={() => navigate('/master/certificate-categories')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <CertificateCategoryForm category={category} mode="edit" />
            </div>
        </>
    );
};

export default EditCertificateCategoryPage;

