import { useParams } from 'react-router-dom';
import PPEStockForm from './PPEStockForm';
import { usePPEStock } from '../../hooks/usePPE';

const EditPPEStockPage = () => {
    const { id } = useParams<{ id: string }>();
    const { stock, isLoading } = usePPEStock(id || null);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!stock) {
        return null;
    }

    return <PPEStockForm stock={stock} mode="edit" />;
};

export default EditPPEStockPage;

