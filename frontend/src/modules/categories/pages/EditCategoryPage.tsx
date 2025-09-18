import { useParams } from 'react-router-dom';
import { useCategory } from '../hooks/useCategories';
import CategoryForm from './CategoryForm';

const EditCategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const { category, isLoading, error } = useCategory(id || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Category not found</h3>
          <p className="text-gray-500">The category you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <CategoryForm category={category} mode="edit" />;
};

export default EditCategoryPage;
