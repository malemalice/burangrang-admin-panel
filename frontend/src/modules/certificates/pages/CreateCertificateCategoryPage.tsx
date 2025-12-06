import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import CertificateCategoryForm from './CertificateCategoryForm';

const CreateCertificateCategoryPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                title="Create Certificate Category"
                subtitle="Add a new certificate category to the system"
                actions={
                    <Button variant="outline" onClick={() => navigate('/master/certificate-categories')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <CertificateCategoryForm mode="create" />
            </div>
        </>
    );
};

export default CreateCertificateCategoryPage;

