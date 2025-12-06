import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import OfficeForm from './OfficeForm';
import officeService from '../../services/officeService';
import { Office } from '@/core/lib/types';

const EditOfficePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [office, setOffice] = useState<Office | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOffice = async () => {
      try {
        if (!id) return;
        const data = await officeService.getOfficeById(id);
        setOffice(data);
      } catch (error) {
        toast.error('Failed to fetch office');
        navigate('/master/offices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffice();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading office details...</span>
        </div>
      </div>
    );
  }

  if (!office) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Office not found
        </h2>
        <p className="text-gray-600 mb-4">
          The office you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/master/offices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Offices
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Office"
        subtitle={`Modify the details of "${office.name}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/master/offices')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Offices
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <OfficeForm office={office} mode="edit" />
      </div>
    </>
  );
};

export default EditOfficePage; 