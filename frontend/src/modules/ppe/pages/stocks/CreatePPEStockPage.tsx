import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import PPEStockForm from './PPEStockForm';

const CreatePPEStockPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                title="Create PPE Stock"
                subtitle="Add a new PPE stock entry to the system"
                actions={
                    <Button variant="outline" onClick={() => navigate('/ppe/stocks')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to PPE Stocks
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <PPEStockForm mode="create" />
            </div>
        </>
    );
};

export default CreatePPEStockPage;

