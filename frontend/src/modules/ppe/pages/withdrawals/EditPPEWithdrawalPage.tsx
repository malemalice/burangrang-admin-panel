import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import PPEWithdrawalForm from './PPEWithdrawalForm';
import { usePPEWithdrawal } from '../../hooks/usePPE';
import { PPEWithdrawalStatus } from '../../types/ppe.types';

const EditPPEWithdrawalPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { withdrawal, isLoading } = usePPEWithdrawal(id || null);

    useEffect(() => {
        if (withdrawal && withdrawal.status !== PPEWithdrawalStatus.PENDING) {
            toast.error('Only pending withdrawals can be edited');
            navigate(`/ppe/withdrawals/${id}`);
        }
    }, [withdrawal, id, navigate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading withdrawal details...</span>
                </div>
            </div>
        );
    }

    if (!withdrawal) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    PPE Withdrawal not found
                </h2>
                <p className="text-gray-600 mb-4">
                    The withdrawal you're looking for doesn't exist or has been deleted.
                </p>
                <Button onClick={() => navigate('/ppe/withdrawals')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to PPE Withdrawals
                </Button>
            </div>
        );
    }

    if (withdrawal.status !== PPEWithdrawalStatus.PENDING) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Cannot Edit Withdrawal
                </h2>
                <p className="text-gray-600 mb-4">
                    Only pending withdrawals can be edited. This withdrawal is {withdrawal.status}.
                </p>
                <Button onClick={() => navigate(`/ppe/withdrawals/${id}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    View Details
                </Button>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Edit PPE Withdrawal"
                subtitle={`Modify the withdrawal request`}
                actions={
                    <Button variant="outline" onClick={() => navigate(`/ppe/withdrawals/${id}`)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <PPEWithdrawalForm withdrawal={withdrawal} mode="edit" />
            </div>
        </>
    );
};

export default EditPPEWithdrawalPage;

