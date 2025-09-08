import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import { useMenu, useMenus } from '../hooks/useMenus';
import MenuForm from '../components/MenuForm';
import { MenuFormData, UpdateMenuDTO } from '../types/menu.types';

const EditMenuPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { menu, isLoading: isLoadingMenu, error: menuError, fetchMenu } = useMenu(id || null);
  const { updateMenu, menus: menusData } = useMenus();

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

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (id && !menu && !isLoadingMenu) {
      fetchMenu(id);
    }
  }, [id, menu, isLoadingMenu, fetchMenu]);

  const handleSubmit = async (data: MenuFormData) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateMenuDTO = {
        name: data.name,
        path: data.path || undefined,
        icon: data.icon || undefined,
        parentId: data.parentId || undefined,
        order: data.order,
        isActive: data.isActive,
        roleIds: data.roleIds || [],
      };

      await updateMenu(id, updateData);
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

  // Handle loading and error states after all hooks are called
  if (isLoadingMenu) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading menu details...</span>
        </div>
      </div>
    );
  }

  if (menuError || !menu) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {menuError || 'Menu not found'}
        </h2>
        <p className="text-gray-600 mb-4">
          The menu item you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/menus')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menus
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Menu Item"
        subtitle={`Modify the details of "${menu.name}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/menus')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menus
          </Button>
        }
      />

      <div className="max-w-2xl">
        <MenuForm
          menu={menu}
          parentMenus={menus.filter(m => m?.id !== menu?.id && !m?.parentId)} // Exclude current menu and its children
          availableRoles={availableRoles}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
          submitButtonText="Update Menu Item"
        />
      </div>
    </>
  );
};

export default EditMenuPage;
