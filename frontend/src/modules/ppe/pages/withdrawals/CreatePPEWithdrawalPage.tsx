import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import PPEWithdrawalForm from './PPEWithdrawalForm';

const CreatePPEWithdrawalPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                title="Create PPE Withdrawal"
                subtitle="Create a new PPE withdrawal request"
                actions={
                    <Button variant="outline" onClick={() => navigate('/ppe/withdrawals')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to PPE Withdrawals
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <PPEWithdrawalForm mode="create" />
            </div>
        </>
    );
};

export default CreatePPEWithdrawalPage;

