import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
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
import { Switch } from '@/core/components/ui/switch';
import { SearchableSelect, MultiSelectSearchable } from '@/core/components/ui/searchable-select';
import { Loader2 } from 'lucide-react';
import { MenuDTO, Menu, MenuFormData } from '../types/menu.types';
import roleService from '../../roles/services/roleService';
import menuService from '../services/menuService';

// Validation schema
const menuFormSchema = z.object({
  name: z.string().min(1, 'Menu name is required').max(100, 'Menu name must be less than 100 characters'),
  path: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  order: z.preprocess(
    (val) => {
      // Convert empty string, null, or undefined to undefined for proper validation
      if (val === '' || val === null || val === undefined) {
        return undefined;
      }
      return Number(val);
    },
    z.number({
      required_error: 'Order is required',
      invalid_type_error: 'Order must be a number',
    })
      .min(0, 'Order must be 0 or greater')
      .max(999, 'Order must be less than 1000')
  ),
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
  const [availableParentMenus, setAvailableParentMenus] = useState<Menu[]>([]);
  const [isLoadingParentMenus, setIsLoadingParentMenus] = useState(false);

  const form = useForm<MenuFormData>({
    resolver: zodResolver(menuFormSchema),
    mode: 'onBlur', // Validate on blur for better UX
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

  // Helper function to build hierarchy path for menu display
  // This helps distinguish menus with the same name by showing their full hierarchy path
  const buildMenuHierarchyPath = (menuItem: Menu, allMenus: Menu[]): string => {
    const pathParts: string[] = [menuItem.name];
    let currentMenu: Menu | undefined = menuItem;
    const visited = new Set<string>(); // Prevent infinite loops
    const maxDepth = 10; // Safety limit for hierarchy depth
    let depth = 0;
    
    // Traverse up the parent chain to build full hierarchy
    while (currentMenu?.parentId && !visited.has(currentMenu.parentId) && depth < maxDepth) {
      visited.add(currentMenu.parentId);
      depth++;
      
      // First try to get parent from the menu's parent property (if populated by backend)
      if (currentMenu.parent) {
        const parent = currentMenu.parent as Menu;
        pathParts.unshift(parent.name);
        currentMenu = parent;
        continue;
      }
      
      // Fallback: look up parent in allMenus array
      const parent = allMenus.find(m => m.id === currentMenu!.parentId);
      if (parent) {
        pathParts.unshift(parent.name);
        currentMenu = parent;
      } else {
        // Parent not found, stop traversal
        break;
      }
    }
    
    const hierarchyPath = pathParts.join(' > ');
    
    // Check if there are other menus with the same final name and similar hierarchy
    // If so, add additional context (path or order) to make them distinguishable
    const menusWithSameName = allMenus.filter(
      m => m.name === menuItem.name && 
      m.id !== menuItem.id &&
      // Check if they might have similar hierarchy by comparing parentId
      (m.parentId === menuItem.parentId || (!m.parentId && !menuItem.parentId))
    );
    
    // Only add extra context if there are truly ambiguous menus
    if (menusWithSameName.length > 0) {
      // Prefer showing path if available, as it's more meaningful
      if (menuItem.path) {
        return `${hierarchyPath} (${menuItem.path})`;
      }
      // Fallback to order number
      return `${hierarchyPath} [${menuItem.order}]`;
    }
    
    return hierarchyPath;
  };

  // Helper function to build hierarchy path for menu display
  // This helps distinguish menus with the same name by showing their full hierarchy path
  const buildMenuHierarchyPath = (menuItem: Menu, allMenus: Menu[]): string => {
    const pathParts: string[] = [menuItem.name];
    let currentMenu: Menu | undefined = menuItem;
    const visited = new Set<string>(); // Prevent infinite loops
    const maxDepth = 10; // Safety limit for hierarchy depth
    let depth = 0;
    
    // Traverse up the parent chain to build full hierarchy
    while (currentMenu?.parentId && !visited.has(currentMenu.parentId) && depth < maxDepth) {
      visited.add(currentMenu.parentId);
      depth++;
      
      // First try to get parent from the menu's parent property (if populated by backend)
      if (currentMenu.parent) {
        const parent = currentMenu.parent as Menu;
        pathParts.unshift(parent.name);
        currentMenu = parent;
        continue;
      }
      
      // Fallback: look up parent in allMenus array
      const parent = allMenus.find(m => m.id === currentMenu!.parentId);
      if (parent) {
        pathParts.unshift(parent.name);
        currentMenu = parent;
      } else {
        // Parent not found, stop traversal
        break;
      }
    }
    
    const hierarchyPath = pathParts.join(' > ');
    
    // Check if there are other menus with the same final name and similar hierarchy
    // If so, add additional context (path or order) to make them distinguishable
    const menusWithSameName = allMenus.filter(
      m => m.name === menuItem.name && 
      m.id !== menuItem.id &&
      // Check if they might have similar hierarchy by comparing parentId
      (m.parentId === menuItem.parentId || (!m.parentId && !menuItem.parentId))
    );
    
    // Only add extra context if there are truly ambiguous menus
    if (menusWithSameName.length > 0) {
      // Prefer showing path if available, as it's more meaningful
      if (menuItem.path) {
        return `${hierarchyPath} (${menuItem.path})`;
      }
      // Fallback to order number
      return `${hierarchyPath} [${menuItem.order}]`;
    }
    
    return hierarchyPath;
  };

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

        // Allow all menus as parents (including those with parent_id)
        // Note: Circular reference prevention is handled by the current menu filter above

        setAvailableParentMenus(filteredMenus);
      } catch (error) {
        console.error('Failed to fetch parent menus:', error);
        setAvailableParentMenus([]);
      } finally {
        setIsLoadingParentMenus(false);
      }
    };

    fetchParentMenus();
  }, [menu]); // Re-fetch when menu changes (for edit mode)

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
                      <FormLabel aria-required="true">Menu Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter menu name" 
                          {...field}
                          aria-describedby="name-description"
                          aria-required="true"
                        />
                      </FormControl>
                      <FormDescription id="name-description">
                        The display name for this menu item
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-muted-foreground">Parent Menu (Optional)</FormLabel>
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
                              label: buildMenuHierarchyPath(menu, availableParentMenus)
                            }))}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select parent menu (optional)"
                            searchPlaceholder="Search parent menus..."
                            emptyText="No parent menus available"
                            includeNone={true}
                            id="parent-menu-select"
                            aria-describedby="parent-menu-description"
                          />
                        )}
                      </FormControl>
                      <FormDescription id="parent-menu-description">
                        Select a parent menu to create a submenu.
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
                      <FormLabel className="text-muted-foreground">Icon (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter icon name (e.g., LayoutDashboard)"
                          {...field}
                          aria-describedby="icon-description"
                        />
                      </FormControl>
                      <FormDescription id="icon-description">
                        Enter the icon name from Lucide React (e.g., LayoutDashboard, Users, Settings)
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
                      <FormLabel className="text-muted-foreground">Path (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="/example-path" 
                          {...field}
                          aria-describedby="path-description"
                        />
                      </FormControl>
                      <FormDescription id="path-description">
                        The URL path for navigation
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
                      <FormLabel aria-required="true">Order *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => {
                            const value = e.target.value;
                            // Allow empty string for validation, but convert to number for submission
                            if (value === '') {
                              field.onChange(undefined);
                            } else {
                              const numValue = parseInt(value, 10);
                              field.onChange(isNaN(numValue) ? undefined : numValue);
                            }
                          }}
                          onBlur={field.onBlur}
                          aria-describedby="order-description"
                          aria-required="true"
                        />
                      </FormControl>
                      <FormDescription id="order-description">
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
                            label: buildMenuHierarchyPath(menu, availableParentMenus)
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
                      Select a parent menu to create a submenu.
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
                        <FormLabel id="isActive-label">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground" id="isActive-description">
                          Disable to hide this menu item from navigation
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-labelledby="isActive-label"
                          aria-describedby="isActive-description"
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
                      <FormLabel className="text-muted-foreground">Assigned Roles (Optional)</FormLabel>
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
                            id="role-ids-select"
                            aria-describedby="role-ids-description"
                          />
                        )}
                      </FormControl>
                      <FormDescription id="role-ids-description">
                        Select the roles that will have access to this menu item. Multiple roles can be selected. Leave empty for no role restriction.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

        <div className="flex justify-end gap-4">
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
