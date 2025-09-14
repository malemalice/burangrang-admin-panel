import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Menu as MenuIcon,
  Link,
  Eye,
  EyeOff,
  Users,
  Hash,
  Calendar,
  Loader2
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { useMenu, useMenus } from '../hooks/useMenus';

const MenuDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { menu, isLoading: isLoadingMenu, error: menuError, fetchMenu } = useMenu(id || null);
  const { deleteMenu } = useMenus();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id && !menu && !isLoadingMenu) {
      fetchMenu(id);
    }
  }, [id, menu, isLoadingMenu, fetchMenu]);

  const handleDelete = async () => {
    if (!menu) return;

    setIsDeleting(true);
    try {
      await deleteMenu(menu.id);
      navigate('/menus');
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
        title={menu.name}
        subtitle="Menu item details and configuration"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/menus/${menu.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => navigate('/menus')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menus
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MenuIcon className="h-5 w-5" />
                Menu Configuration
              </CardTitle>
              <CardDescription>
                Basic information and settings for this menu item
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900 mt-1">{menu.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Order</label>
                  <p className="text-sm text-gray-900 mt-1">{menu.order}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Path</label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                    {menu.path ? (
                      <>
                        <Link className="h-4 w-4" />
                        {menu.path}
                      </>
                    ) : (
                      <span className="text-gray-500">No path configured</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Icon</label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                    {menu.icon ? (
                      <>
                        <Hash className="h-4 w-4" />
                        {menu.icon}
                      </>
                    ) : (
                      <span className="text-gray-500">No icon configured</span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Parent Menu</label>
                <p className="text-sm text-gray-900 mt-1">
                  {menu.parentId ? (
                    <span className="text-blue-600">Has parent menu</span>
                  ) : (
                    <span className="text-gray-500">Root level menu</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Status & Visibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {menu.isActive ? (
                    <Badge className="bg-green-100 text-green-800 border-0">
                      <Eye className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {menu.isVisible ? (
                    <Badge className="bg-blue-100 text-blue-800 border-0">
                      <Eye className="h-3 w-3 mr-1" />
                      Visible
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hidden
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Access Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Access Control
              </CardTitle>
              <CardDescription>
                Roles that can access this menu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menu.roles && menu.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {menu.roles.map((role) => (
                    <Badge key={role.id} variant="outline" className="bg-blue-50 text-blue-700 border-0">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No roles assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Children */}
          {menu.children && menu.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MenuIcon className="h-5 w-5" />
                  Child Menus
                </CardTitle>
                <CardDescription>
                  Submenu items under this menu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {menu.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{child.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Order: {child.order}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Created
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(menu.createdAt)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(menu.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${menu.name}"? This action cannot be undone and may affect navigation for users.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
        isLoading={isDeleting}
      />
    </>
  );
};

export default MenuDetailPage;
