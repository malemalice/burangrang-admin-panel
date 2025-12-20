import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RiskCategoryForm from './RiskCategoryForm';
import { riskCategoryService } from '@/modules/master-data';
import { RiskCategory } from '@/core/lib/types';

const EditRiskCategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [riskCategory, setRiskCategory] = useState<RiskCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRiskCategory = async () => {
      try {
        if (!id) return;
        const data = await riskCategoryService.getById(id);
        setRiskCategory(data);
      } catch (error) {
        toast.error('Failed to fetch risk category');
        navigate('/master/risk-categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiskCategory();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading risk category details...</span>
        </div>
      </div>
    );
  }

  if (!riskCategory) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Risk Category not found
        </h2>
        <p className="text-gray-600 mb-4">
          The risk category you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/master/risk-categories')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Risk Categories
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Risk Category"
        subtitle={`Modify the details of "${riskCategory.name}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/master/risk-categories')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Categories
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <RiskCategoryForm riskCategory={riskCategory} mode="edit" />
      </div>
    </>
  );
};

export default EditRiskCategoryPage;
