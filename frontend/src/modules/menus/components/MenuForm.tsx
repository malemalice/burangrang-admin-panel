import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
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
import { Loader2, X } from 'lucide-react';
import { MenuDTO, MenuFormData } from '../types/menu.types';

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
  parentMenus?: MenuDTO[];
  availableRoles?: Array<{ id: string; name: string }>;
  onSubmit: (data: MenuFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
}

const MenuForm: React.FC<MenuFormProps> = ({
  menu,
  parentMenus = [],
  availableRoles = [],
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText = 'Save Menu',
}) => {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

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
      setSelectedRoleIds(menu.roles?.map(role => role.id) || []);
    }
  }, [menu, form]);

  const handleSubmit = async (data: MenuFormData) => {
    try {
      await onSubmit({
        ...data,
        parentId: data.parentId === "none" ? undefined : data.parentId,
        roleIds: selectedRoleIds,
      });
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleRemoveRole = (roleId: string) => {
    setSelectedRoleIds(prev => prev.filter(id => id !== roleId));
  };

  // Filter out current menu and its children from parent options
  const availableParentMenus = parentMenus.filter(parentMenu => {
    if (!menu) return true;
    // Don't allow selecting self or children as parent
    return parentMenu?.id !== menu?.id;
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
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
                <FormItem>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Input placeholder="LayoutDashboard" {...field} />
                    </FormControl>
                    <FormDescription>
                      Icon name from Lucide React
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
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
                <FormItem>
                  <FormLabel>Parent Menu</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent menu (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No parent (root level)</SelectItem>
                      {availableParentMenus.map((parentMenu) => (
                        <SelectItem key={parentMenu.id} value={parentMenu.id}>
                          {parentMenu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a parent menu to create a submenu
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibility & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Whether this menu item is active and accessible
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Assigned Roles</Label>
              <div className="mt-2">
                {availableRoles.length > 0 ? (
                  <div className="space-y-2">
                    {availableRoles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={selectedRoleIds.includes(role.id)}
                          onCheckedChange={() => handleRoleToggle(role.id)}
                        />
                        <Label
                          htmlFor={`role-${role.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {role.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No roles available</p>
                )}
              </div>
            </div>

            {selectedRoleIds.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Selected Roles</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedRoleIds.map((roleId) => {
                    const role = availableRoles.find(r => r.id === roleId);
                    return (
                      <Badge key={roleId} variant="secondary" className="flex items-center gap-1">
                        {role?.name || roleId}
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(roleId)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
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
  );
};

export default MenuForm;
