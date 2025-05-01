
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Menu as MenuIcon, Eye, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DataTable from '@/components/ui/data-table/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  parent: string | null;
  order: number;
  visible: boolean;
  roles: string[];
}

// Mock data
const mockMenuItems: MenuItem[] = [
  {
    id: 'menu-1',
    title: 'Dashboard',
    path: '/',
    icon: 'LayoutDashboard',
    parent: null,
    order: 1,
    visible: true,
    roles: ['All Roles'],
  },
  {
    id: 'menu-2',
    title: 'Users',
    path: '/users',
    icon: 'Users',
    parent: null,
    order: 2,
    visible: true,
    roles: ['Admin', 'Manager'],
  },
  {
    id: 'menu-3',
    title: 'Roles',
    path: '/roles',
    icon: 'ShieldCheck',
    parent: null,
    order: 3,
    visible: true,
    roles: ['Admin'],
  },
  {
    id: 'menu-4',
    title: 'Menus',
    path: '/menus',
    icon: 'Menu',
    parent: null,
    order: 4,
    visible: true,
    roles: ['Admin'],
  },
  {
    id: 'menu-5',
    title: 'Master Data',
    path: '#',
    icon: 'Building2',
    parent: null,
    order: 5,
    visible: true,
    roles: ['Admin', 'Manager'],
  },
  {
    id: 'menu-6',
    title: 'Offices',
    path: '/master/offices',
    icon: 'Building',
    parent: 'menu-5',
    order: 1,
    visible: true,
    roles: ['Admin', 'Manager'],
  },
  {
    id: 'menu-7',
    title: 'Departments',
    path: '/master/departments',
    icon: 'Briefcase',
    parent: 'menu-5',
    order: 2,
    visible: true,
    roles: ['Admin', 'Manager'],
  },
  {
    id: 'menu-8',
    title: 'Positions',
    path: '/master/positions',
    icon: 'Users',
    parent: 'menu-5',
    order: 3,
    visible: true,
    roles: ['Admin', 'Manager', 'HR'],
  },
  {
    id: 'menu-9',
    title: 'Assets',
    path: '/master/assets',
    icon: 'Package',
    parent: 'menu-5',
    order: 4,
    visible: true,
    roles: ['Admin', 'Manager', 'User'],
  },
  {
    id: 'menu-10',
    title: 'Settings',
    path: '/settings',
    icon: 'Settings',
    parent: null,
    order: 6,
    visible: true,
    roles: ['Admin'],
  },
];

const MenusPage = () => {
  const navigate = useNavigate();
  const [menuItems] = useState<MenuItem[]>(mockMenuItems);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<MenuItem | null>(null);

  const handleDeleteClick = (menu: MenuItem) => {
    setMenuToDelete(menu);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (menuToDelete) {
      // API call would go here
      toast.success(`Menu item "${menuToDelete.title}" has been deleted`);
      setDeleteDialogOpen(false);
      setMenuToDelete(null);
    }
  };

  const columns = [
    {
      id: 'title',
      header: 'Menu Item',
      isSortable: true,
      cell: (menu: MenuItem) => (
        <div className="flex items-center">
          {menu.parent && <ArrowRight size={16} className="mr-2 text-gray-400" />}
          <div>
            <p className={`font-medium ${menu.parent ? 'ml-2' : ''}`}>{menu.title}</p>
            <p className="text-xs text-gray-500 mt-1">{menu.path}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'icon',
      header: 'Icon',
      cell: (menu: MenuItem) => <div className="text-sm">{menu.icon}</div>,
    },
    {
      id: 'order',
      header: 'Order',
      isSortable: true,
      cell: (menu: MenuItem) => <div className="text-center">{menu.order}</div>,
    },
    {
      id: 'visible',
      header: 'Status',
      cell: (menu: MenuItem) => (
        <Badge variant="outline" className={menu.visible ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-800 border-0'}>
          {menu.visible ? 'Visible' : 'Hidden'}
        </Badge>
      ),
    },
    {
      id: 'roles',
      header: 'Access',
      cell: (menu: MenuItem) => (
        <div className="flex flex-wrap gap-2">
          {menu.roles.length > 2 ? (
            <>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
                {menu.roles[0]}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
                +{menu.roles.length - 1} more
              </Badge>
            </>
          ) : (
            menu.roles.map((role) => (
              <Badge key={role} variant="outline" className="bg-blue-50 text-blue-700 border-0">
                {role}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (menu: MenuItem) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path
                  d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
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
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Menu Management"
        subtitle="Configure and organize application menus"
        actions={
          <Button onClick={() => navigate('/menus/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Menu Item
          </Button>
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
            <p className="text-sm">
              {mockMenuItems.filter(m => m.parent === null).length} parent items with{' '}
              {mockMenuItems.filter(m => m.parent !== null).length} child items
            </p>
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
            <p className="text-sm">
              {Array.from(new Set(mockMenuItems.flatMap(m => m.roles))).length} roles with custom menu access
            </p>
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
            <p className="text-sm">
              {mockMenuItems.filter(m => m.visible).length} visible items, {mockMenuItems.filter(m => !m.visible).length} hidden items
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={menuItems}
        pagination={{
          pageIndex,
          pageSize,
          pageCount: Math.ceil(menuItems.length / pageSize),
          onPageChange: setPageIndex,
          onPageSizeChange: setPageSize,
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${menuToDelete?.title}"? This may affect navigation for users.`}
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
