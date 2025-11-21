import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
        return <div>Loading...</div>;
    }

    if (!withdrawal) {
        return null;
    }

    if (withdrawal.status !== PPEWithdrawalStatus.PENDING) {
        return null;
    }

    return <PPEWithdrawalForm withdrawal={withdrawal} mode="edit" />;
};

export default EditPPEWithdrawalPage;

