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

  // Mock roles - in real app this would come from API
  const availableRoles = [
    { id: 'role-1', name: 'Admin' },
    { id: 'role-2', name: 'Manager' },
    { id: 'role-3', name: 'User' },
    { id: 'role-4', name: 'HR' },
  ];

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
        roleIds: data.roleIds || [],
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

      <div className="max-w-2xl">
        <MenuForm
          parentMenus={menus.filter(menu => !menu?.parentId)} // Only root level menus can be parents
          availableRoles={availableRoles}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
          submitButtonText="Create Menu Item"
        />
      </div>
    </>
  );
};

export default CreateMenuPage;
