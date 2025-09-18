import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import ProductTypeForm from './ProductTypeForm';
import { useProductType } from '../hooks/useProductTypes';

const EditProductTypePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { productType, isLoading, error } = useProductType(id || null);

  useEffect(() => {
    if (error) {
      toast.error('Failed to load product type');
      navigate('/product-types');
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!productType) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Product Type not found</h3>
          <p className="text-gray-500">The product type you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <ProductTypeForm productType={productType} mode="edit" />;
};

export default EditProductTypePage;
