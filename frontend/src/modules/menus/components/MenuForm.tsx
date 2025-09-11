import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Switch } from '@/core/components/ui/switch';
import { SearchableSelect, MultiSelectSearchable } from '@/core/components/ui/searchable-select';
import { Loader2, X } from 'lucide-react';
import { MenuDTO, MenuFormData } from '../types/menu.types';
import roleService from '../../roles/services/roleService';
import menuService from '../services/menuService';

// Validation schema
const menuFormSchema = z.object({
  name: z.string().min(1, 'Menu name is required').max(100, 'Menu name must be less than 100 characters'),
  path: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().min(0, 'Order must be 0 or greater').max(999, 'Order must be less than 1000'),
  isActive: z.boolean().default(true),
  roleIds: z.array(z.string()).default([]),
});

interface MenuFormProps {
  menu?: MenuDTO | null;
  onSubmit: (data: MenuFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
}

const MenuForm: React.FC<MenuFormProps> = ({
  menu,
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText = 'Save Menu',
}) => {
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [availableParentMenus, setAvailableParentMenus] = useState<MenuDTO[]>([]);
  const [isLoadingParentMenus, setIsLoadingParentMenus] = useState(false);

  const form = useForm<MenuFormData>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: menu?.name || '',
      path: menu?.path || '',
      icon: menu?.icon || '',
      parentId: menu?.parentId || 'none',
      order: menu?.order || 0,
      isActive: menu?.isActive ?? true,
      roleIds: menu?.roles?.map(role => role.id) || [],
    },
  });

  // Fetch available roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      try {
        const response = await roleService.getRoles({
          page: 1,
          limit: 100, // Get all roles for the dropdown
        });
        setAvailableRoles(response.data.map(role => ({
          id: role.id,
          name: role.name
        })));
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        setAvailableRoles([]);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  // Fetch available parent menus from API
  useEffect(() => {
    const fetchParentMenus = async () => {
      setIsLoadingParentMenus(true);
      try {
        const response = await menuService.getMenus({
          page: 1,
          limit: 100, // Get all menus
          filters: {
            isActive: true, // Only active menus
          }
        });

        // Filter out the current menu (if editing) and child menus to prevent circular references
        let filteredMenus = response.data || [];
        if (menu) {
          filteredMenus = filteredMenus.filter(m => m.id !== menu.id);
        }

        // Only allow root-level menus (no parent) as parents to avoid deep nesting issues
        filteredMenus = filteredMenus.filter(m => !m.parentId);

        setAvailableParentMenus(filteredMenus);
      } catch (error) {
        console.error('Failed to fetch parent menus:', error);
        setAvailableParentMenus([]);
      } finally {
        setIsLoadingParentMenus(false);
      }
    };

    fetchParentMenus();
  }, [menu?.id]); // Re-fetch when menu changes (for edit mode)

  // Update form when menu prop changes
  useEffect(() => {
    if (menu) {
      form.reset({
        name: menu.name,
        path: menu.path || '',
        icon: menu.icon || '',
        parentId: menu.parentId || 'none',
        order: menu.order,
        isActive: menu.isActive,
        roleIds: menu.roles?.map(role => role.id) || [],
      });
    }
  }, [menu, form]);

  const handleSubmit = async (data: MenuFormData) => {
    try {
      await onSubmit({
        ...data,
        parentId: data.parentId === "none" ? undefined : data.parentId,
        roleIds: data.roleIds,
      });
    } catch (error) {
      // Error handling is done by parent component
    }
  };



  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Menu Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter menu name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The display name for this menu item
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="path"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Path</FormLabel>
                      <FormControl>
                        <Input placeholder="/example-path" {...field} />
                      </FormControl>
                      <FormDescription>
                        The URL path for navigation (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter icon name (e.g., LayoutDashboard)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the icon name from Lucide React (e.g., LayoutDashboard, Users, Settings)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Order *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Display order (0-999)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem className="flex flex-col md:col-span-2">
                    <FormLabel>Parent Menu</FormLabel>
                    <FormControl>
                      {isLoadingParentMenus ? (
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-500">Loading parent menus...</span>
                        </div>
                      ) : (
                        <SearchableSelect
                          options={availableParentMenus.map(menu => ({
                            value: menu.id,
                            label: menu.name
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select parent menu (optional)"
                          searchPlaceholder="Search parent menus..."
                          emptyText="No parent menus available"
                          includeNone={true}
                        />
                      )}
                    </FormControl>
                    <FormDescription>
                      Select a parent menu to create a submenu. Only active root-level menus are shown.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Access Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 md:col-span-2">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <div className="text-sm text-gray-500">
                          Disable to hide this menu item from navigation
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roleIds"
                  render={({ field }) => (
                    <FormItem className="flex flex-col md:col-span-2">
                      <FormLabel>Assigned Roles</FormLabel>
                      <FormControl>
                        {isLoadingRoles ? (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-gray-500">Loading roles...</span>
                          </div>
                        ) : (
                          <MultiSelectSearchable
                            options={availableRoles.map(role => ({
                              value: role.id,
                              label: role.name
                            }))}
                            value={field.value || []}
                            onValueChange={field.onChange}
                            placeholder="Select roles for this menu"
                            searchPlaceholder="Search roles..."
                            emptyText="No roles available"
                            maxDisplay={3}
                          />
                        )}
                      </FormControl>
                      <FormDescription>
                        Select the roles that will have access to this menu item. Multiple roles can be selected. Leave empty for no role restriction.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
    </div>
  );
};

export default MenuForm;
