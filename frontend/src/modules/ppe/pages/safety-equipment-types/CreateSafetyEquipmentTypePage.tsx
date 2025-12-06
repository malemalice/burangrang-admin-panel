import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import SafetyEquipmentTypeForm from './SafetyEquipmentTypeForm';

const CreateSafetyEquipmentTypePage = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                title="Create Safety Equipment Type"
                subtitle="Add a new safety equipment type to the system"
                actions={
                    <Button variant="outline" onClick={() => navigate('/master/safety-equipment-types')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Safety Equipment Types
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <SafetyEquipmentTypeForm mode="create" />
            </div>
        </>
    );
};

export default CreateSafetyEquipmentTypePage;

