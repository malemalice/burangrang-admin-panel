import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import SafetyEquipmentForm from './SafetyEquipmentForm';

const CreateSafetyEquipmentPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                title="Create Safety Equipment"
                subtitle="Add a new safety equipment to the system"
                actions={
                    <Button variant="outline" onClick={() => navigate('/master/safety-equipments')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Safety Equipments
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <SafetyEquipmentForm mode="create" />
            </div>
        </>
    );
};

export default CreateSafetyEquipmentPage;

