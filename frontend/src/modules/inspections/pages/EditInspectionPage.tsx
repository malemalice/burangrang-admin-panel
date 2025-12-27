import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import InspectionForm from '../components/InspectionForm';
import inspectionsService from '../services/inspectionsService';
import { Inspection } from '../types/inspection.types';

const EditInspectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        if (!id) return;
        const data = await inspectionsService.getById(id);
        setInspection(data);
      } catch (error) {
        toast.error('Failed to fetch inspection');
        navigate('/inspections');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInspection();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading inspection details...</span>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Inspection not found
        </h2>
        <p className="text-gray-600 mb-4">
          The inspection you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/inspections')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inspections
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Inspection"
        subtitle={`Modify the details of "${inspection.code}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/inspections')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inspections
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <InspectionForm inspection={inspection} mode="edit" />
      </div>
    </>
  );
};

export default EditInspectionPage;

