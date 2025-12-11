import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import CertificateForm from './CertificateForm';
import { useCertificate } from '../hooks/useCertificates';

const EditCertificatePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { certificate, isLoading, fetchCertificate } = useCertificate(id || null);

    useEffect(() => {
        if (id) {
            fetchCertificate(id);
        }
    }, [id, fetchCertificate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading certificate details...</span>
                </div>
            </div>
        );
    }

    if (!certificate) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Certificate not found
                </h2>
                <p className="text-gray-600 mb-4">
                    The certificate you're looking for doesn't exist or has been deleted.
                </p>
                <Button onClick={() => navigate('/certificates')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Certificates
                </Button>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Edit Certificate"
                subtitle={`Update certificate information for "${certificate.certificateName}"`}
                actions={
                    <Button variant="outline" onClick={() => navigate('/certificates')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Certificates
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <CertificateForm mode="edit" />
            </div>
        </>
    );
};

export default EditCertificatePage;
