import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
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
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading safety equipment type details...</span>
                </div>
            </div>
        );
    }

    if (!type) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Safety Equipment Type not found
                </h2>
                <p className="text-gray-600 mb-4">
                    The safety equipment type you're looking for doesn't exist or has been deleted.
                </p>
                <Button onClick={() => navigate('/master/safety-equipment-types')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Safety Equipment Types
                </Button>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Edit Safety Equipment Type"
                subtitle={`Modify the details of "${type.name}"`}
                actions={
                    <Button variant="outline" onClick={() => navigate('/master/safety-equipment-types')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Safety Equipment Types
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <SafetyEquipmentTypeForm type={type} mode="edit" />
            </div>
        </>
    );
};

export default EditSafetyEquipmentTypePage;

