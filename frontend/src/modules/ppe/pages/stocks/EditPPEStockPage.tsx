import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import PPEStockForm from './PPEStockForm';
import { usePPEStock } from '../../hooks/usePPE';

const EditPPEStockPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { stock, isLoading } = usePPEStock(id || null);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading PPE stock details...</span>
                </div>
            </div>
        );
    }

    if (!stock) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    PPE Stock not found
                </h2>
                <p className="text-gray-600 mb-4">
                    The PPE stock you're looking for doesn't exist or has been deleted.
                </p>
                <Button onClick={() => navigate('/ppe/stocks')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to PPE Stocks
                </Button>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Edit PPE Stock"
                subtitle={`Modify the details of stock entry`}
                actions={
                    <Button variant="outline" onClick={() => navigate(`/ppe/stocks/${id}`)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <PPEStockForm stock={stock} mode="edit" />
            </div>
        </>
    );
};

export default EditPPEStockPage;

