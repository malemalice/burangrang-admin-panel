import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import ProductForm from './ProductForm';
import { useEffect } from 'react';

const EditProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, isLoading, error } = useProduct(id || null);

  useEffect(() => {
    if (error && !isLoading) {
      navigate('/products');
    }
  }, [error, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return <ProductForm product={product} mode="edit" />;
};

export default EditProductPage;
