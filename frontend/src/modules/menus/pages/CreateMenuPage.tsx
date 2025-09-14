import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import { useMenus } from '../hooks/useMenus';
import MenuForm from '../components/MenuForm';
import { MenuFormData, CreateMenuDTO } from '../types/menu.types';

const CreateMenuPage = () => {
  const navigate = useNavigate();
  const { createMenu, menus: menusData } = useMenus();

  // Ensure menus is always an array
  const menus = Array.isArray(menusData) ? menusData : [];
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleSubmit = async (data: MenuFormData) => {
    setIsSubmitting(true);
    try {
      const createData: CreateMenuDTO = {
        name: data.name,
        path: data.path || undefined,
        icon: data.icon || undefined,
        parentId: data.parentId || undefined,
        order: data.order,
        isActive: data.isActive,
        roleIds: data.roleIds,
      };

      await createMenu(createData);
      navigate('/menus');
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/menus');
  };

  return (
    <>
      <PageHeader
        title="Create Menu Item"
        subtitle="Add a new menu item to the navigation system"
        actions={
          <Button variant="outline" onClick={() => navigate('/menus')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menus
          </Button>
        }
      />

      <MenuForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        submitButtonText="Create Menu Item"
      />
    </>
  );
};

export default CreateMenuPage;
