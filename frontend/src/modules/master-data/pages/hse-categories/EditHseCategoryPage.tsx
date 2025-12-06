import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import HseCategoryForm from './HseCategoryForm';
import { hseCategoryService } from '@/modules/master-data';
import { HseCategory } from '@/core/lib/types';

const EditHseCategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hseCategory, setHseCategory] = useState<HseCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHseCategory = async () => {
      try {
        if (!id) return;
        const data = await hseCategoryService.getById(id);
        setHseCategory(data);
      } catch (error) {
        toast.error('Failed to fetch HSE category');
        navigate('/master/hse-categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHseCategory();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading HSE category details...</span>
        </div>
      </div>
    );
  }

  if (!hseCategory) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          HSE Category not found
        </h2>
        <p className="text-gray-600 mb-4">
          The HSE category you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/master/hse-categories')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to HSE Categories
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit HSE Category"
        subtitle={`Modify the details of "${hseCategory.name}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/master/hse-categories')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to HSE Categories
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <HseCategoryForm hseCategory={hseCategory} mode="edit" />
      </div>
    </>
  );
};

export default EditHseCategoryPage; 