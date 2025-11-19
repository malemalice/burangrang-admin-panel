import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SafetyEquipmentForm from './SafetyEquipmentForm';
import safetyEquipmentService from '../../services/safetyEquipmentService';
import { SafetyEquipment } from '../../types/ppe-master-data.types';

const EditSafetyEquipmentPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState<SafetyEquipment | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                if (!id) return;
                const data = await safetyEquipmentService.getSafetyEquipment(id);
                setEquipment(data);
            } catch (error) {
                toast.error('Failed to fetch safety equipment');
                navigate('/master/safety-equipments');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEquipment();
    }, [id, navigate]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!equipment) {
        return null;
    }

    return <SafetyEquipmentForm equipment={equipment} mode="edit" />;
};

export default EditSafetyEquipmentPage;

