import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SafetyEquipmentTypeForm from './SafetyEquipmentTypeForm';
import safetyEquipmentTypeService from '../../services/safetyEquipmentTypeService';
import { SafetyEquipmentType } from '../../types/ppe-master-data.types';

const EditSafetyEquipmentTypePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [type, setType] = useState<SafetyEquipmentType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchType = async () => {
            try {
                if (!id) return;
                const data = await safetyEquipmentTypeService.getSafetyEquipmentType(id);
                setType(data);
            } catch (error) {
                toast.error('Failed to fetch safety equipment type');
                navigate('/master/safety-equipment-types');
            } finally {
                setIsLoading(false);
            }
        };

        fetchType();
    }, [id, navigate]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!type) {
        return null;
    }

    return <SafetyEquipmentTypeForm type={type} mode="edit" />;
};

export default EditSafetyEquipmentTypePage;

