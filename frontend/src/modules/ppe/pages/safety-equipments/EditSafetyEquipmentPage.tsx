import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
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
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading safety equipment details...</span>
                </div>
            </div>
        );
    }

    if (!equipment) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Safety Equipment not found
                </h2>
                <p className="text-gray-600 mb-4">
                    The safety equipment you're looking for doesn't exist or has been deleted.
                </p>
                <Button onClick={() => navigate('/master/safety-equipments')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Safety Equipments
                </Button>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Edit Safety Equipment"
                subtitle={`Modify the details of "${equipment.name}"`}
                actions={
                    <Button variant="outline" onClick={() => navigate('/master/safety-equipments')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Safety Equipments
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <SafetyEquipmentForm equipment={equipment} mode="edit" />
            </div>
        </>
    );
};

export default EditSafetyEquipmentPage;

