import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!category) {
        return null;
    }

    return <CertificateCategoryForm category={category} mode="edit" />;
};

export default EditCertificateCategoryPage;

