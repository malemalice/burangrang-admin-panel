import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import HseCategoryForm from './HseCategoryForm';
import hseCategoryService from '@/services/hseCategoryService';
import { HseCategory } from '@/lib/types';

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
    return <div>Loading...</div>;
  }

  if (!hseCategory) {
    return null;
  }

  return <HseCategoryForm hseCategory={hseCategory} mode="edit" />;
};

export default EditHseCategoryPage; 