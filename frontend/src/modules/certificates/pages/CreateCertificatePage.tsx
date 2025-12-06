import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import CertificateForm from './CertificateForm';

const CreateCertificatePage = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                title="Create Certificate"
                subtitle="Add a new certificate or license"
                actions={
                    <Button variant="outline" onClick={() => navigate('/certificates')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Certificates
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <CertificateForm mode="create" />
            </div>
        </>
    );
};

export default CreateCertificatePage;
