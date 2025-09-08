import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import officeService from '../../services/officeService';
import { CreateOfficeDTO, UpdateOfficeDTO } from '../../types/master-data.types';
import { Office } from '@/core/lib/types';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';

const formSchema = z.object({
  name: z.string().min(1, 'Office name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface OfficeFormProps {
  office?: Office;
  mode: 'create' | 'edit';
}

const OfficeForm = ({ office, mode }: OfficeFormProps) => {
  const navigate = useNavigate();
  const [parentOffices, setParentOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Convert parent offices to SearchableSelectOption format
  const parentOfficeOptions: SearchableSelectOption[] = parentOffices.map(office => ({
    value: office.id,
    label: office.name
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      parentId: 'none',
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);

        // Fetch parent offices
        const params = {
          page: 1,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc' as const
        };

        let officesResponse;
        if (mode === 'edit' && office) {
          // For edit mode, exclude current office and its children to prevent circular relationships
          const allOffices = await officeService.getOffices(params);
          officesResponse = {
            ...allOffices,
            data: allOffices.data.filter(o =>
              o.id !== office.id && !isChildOf(o, office.id)
            )
          };
        } else {
          officesResponse = await officeService.getOffices(params);
        }

        setParentOffices(officesResponse.data || []);

        // Set form data for edit mode
        if (office && mode === 'edit') {
          form.reset({
            name: office.name,
            code: office.code || '',
            description: office.description || '',
            address: office.address || '',
            phone: office.phone || '',
            email: office.email || '',
            parentId: office.parentId || 'none',
            isActive: office.isActive || true,
          });
        }

        setDataReady(true);
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [office, mode, form]);

  // Helper function to check if an office is a child of the specified parent
  const isChildOf = (office: Office, parentId: string): boolean => {
    if (!office.children || office.children.length === 0) {
      return false;
    }

    return office.children.some(child =>
      child.id === parentId || isChildOf(child, parentId)
    );
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      if (mode === 'create') {
        const officeData: CreateOfficeDTO = {
          name: data.name,
          code: data.code || undefined,
          description: data.description || undefined,
          address: data.address || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          parentId: data.parentId === 'none' ? null : data.parentId || null,
          isActive: data.isActive,
        };
        await officeService.createOffice(officeData);
        toast.success('Office created successfully');
      } else if (office) {
        const officeData: UpdateOfficeDTO = {
          name: data.name,
          code: data.code || undefined,
          description: data.description || undefined,
          address: data.address || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          parentId: data.parentId === 'none' ? null : data.parentId || null,
          isActive: data.isActive,
        };

        await officeService.updateOffice(office.id, officeData);
        toast.success('Office updated successfully');
      }
      navigate('/master/offices');
    } catch (error: unknown) {
      console.error('Error saving office:', error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${mode} office`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData && !dataReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Office</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter office name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter office code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Parent Office</FormLabel>
                  <FormControl>
                    {dataReady && (
                      <SearchableSelect
                        options={parentOfficeOptions}
                        value={field.value}
                        onValueChange={(value) => form.setValue("parentId", value)}
                        placeholder="Select a parent office (optional)"
                        searchPlaceholder="Search offices..."
                        emptyText="No offices found"
                        includeNone={true}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter office description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter office address"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-gray-500">
                      Set whether this office is active
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

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/master/offices')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {mode === 'create' ? 'Create Office' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default OfficeForm;
