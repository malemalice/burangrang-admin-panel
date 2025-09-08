import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Menu as MenuIcon, Eye, ShieldCheck, ArrowRight, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import { useMenus } from '../hooks/useMenus';
import menuService from '../services/menuService';
import { MenuDTO } from '../types/menu.types';

const MenusPage = () => {
  const navigate = useNavigate();

  // State management following users module pattern
  const [menus, setMenus] = useState<MenuDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMenus, setTotalMenus] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<MenuDTO | null>(null);
  const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

  // Get the service directly like users module does
  const { deleteMenu } = useMenus();

  // Memoized fetch function following users module pattern
  const fetchMenus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await menuService.getMenus({
        page: pageIndex + 1, // API expects 1-based pagination
        limit,
      });

      const menuData = response?.data || [];
      setMenus(menuData);
      setTotalMenus(response?.meta?.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menus';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit]); // Following users module pattern with proper dependencies

  // Load menus when dependencies change - following users module pattern
  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleDropdownOpenChange = (id: string, open: boolean) => {
    setDropdownOpenStates(prev => ({
      ...prev,
      [id]: open
    }));
  };

  const handleDeleteClick = (menu: MenuDTO) => {
    // Close the dropdown menu for this menu item
    setDropdownOpenStates(prev => ({
      ...prev,
      [menu.id]: false
    }));

    // Set menu to delete and open the dialog
    setMenuToDelete(menu);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!menuToDelete) return;

    setIsLoading(true);
    try {
      await deleteMenu(menuToDelete.id);
      toast.success(`Menu item "${menuToDelete.name}" has been deleted`);
      // Refetch data following users module pattern
      fetchMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast.error('Failed to delete menu item');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setMenuToDelete(null);
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Menu Item',
      isSortable: true,
      cell: (menu: MenuDTO) => (
        <div className="flex items-center">
          {menu.parentId && <ArrowRight size={16} className="mr-2 text-gray-400" />}
          <div>
            <p className={`font-medium ${menu.parentId ? 'ml-2' : ''}`}>{menu.name}</p>
            <p className="text-xs text-gray-500 mt-1">{menu.path || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'icon',
      header: 'Icon',
      cell: (menu: MenuDTO) => <div className="text-sm">{menu.icon || 'N/A'}</div>,
    },
    {
      id: 'order',
      header: 'Order',
      isSortable: true,
      cell: (menu: MenuDTO) => <div className="text-center">{menu.order}</div>,
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (menu: MenuDTO) => (
        <Badge variant="outline" className={menu.isActive ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-800 border-0'}>
          {menu.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'roles',
      header: 'Access',
      cell: (menu: MenuDTO) => (
        <div className="flex flex-wrap gap-2">
          {menu.roles && menu.roles.length > 0 ? (
            menu.roles.length > 2 ? (
              <>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
                  {menu.roles[0].name}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
                  +{menu.roles.length - 1} more
                </Badge>
              </>
            ) : (
              menu.roles.map((role) => (
                <Badge key={role.id} variant="outline" className="bg-blue-50 text-blue-700 border-0">
                  {role.name}
                </Badge>
              ))
            )
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-0">
              No roles assigned
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (menu: MenuDTO) => (
        <DropdownMenu
          open={dropdownOpenStates[menu.id]}
          onOpenChange={(open) => handleDropdownOpenChange(menu.id, open)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/menus/${menu.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/menus/${menu.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteClick(menu)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  // Handle error state according to TRD guidelines
  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Menus</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Show initial loading state if data hasn't been loaded yet
  if (isLoading && menus.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading menu data...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Menu Management"
        subtitle="Configure and organize application menus"
        actions={
          <ThemeButton onClick={() => navigate('/menus/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Menu Item
          </ThemeButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MenuIcon size={18} /> Navigation Structure
            </CardTitle>
            <CardDescription>Organize your menu hierarchy</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : menus && menus.length > 0 ? (
              <p className="text-sm">
                {menus.filter(m => m?.parentId === null).length} parent items with{' '}
                {menus.filter(m => m?.parentId !== null).length} child items
              </p>
            ) : (
              <p className="text-sm text-gray-500">No menu items available</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck size={18} /> Access Control
            </CardTitle>
            <CardDescription>Role-based menu visibility</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : menus && menus.length > 0 ? (
              <p className="text-sm">
                {Array.from(new Set(menus.flatMap(m => m?.roles?.map(r => r?.name) || []))).length} roles with custom menu access
              </p>
            ) : (
              <p className="text-sm text-gray-500">No menu items available</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye size={18} /> Visibility Status
            </CardTitle>
            <CardDescription>Control menu item visibility</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : menus && menus.length > 0 ? (
              <p className="text-sm">
                {menus.filter(m => m?.isActive).length} active items, {menus.filter(m => !m?.isActive).length} inactive items
              </p>
            ) : (
              <p className="text-sm text-gray-500">No menu items available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={menus}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalMenus / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalMenus
        }}
        isLoading={isLoading}
      />


      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${menuToDelete?.name}"? This may affect navigation for users.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
      />
    </>
  );
};

export default MenusPage;
