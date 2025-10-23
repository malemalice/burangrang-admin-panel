import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import threatService from '@/services/threatService';
import hseCategoryService from '@/services/hseCategoryService';
import { Threat, HseCategory } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  hseCategoryId: z.string().min(1, 'HSE Category is required'),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface ThreatFormProps {
  threat?: Threat;
  mode: 'create' | 'edit';
}

const ThreatForm = ({ threat, mode }: ThreatFormProps) => {
  const navigate = useNavigate();
  const [hseCategories, setHseCategories] = useState<HseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      hseCategoryId: '',
      isActive: true,
    },
  });

  // Fetch HSE categories for the dropdown
  useEffect(() => {
    const fetchHseCategories = async () => {
      try {
        const response = await hseCategoryService.getAll({
          limit: 100,
          isActive: true,
        });
        setHseCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch HSE categories:', error);
        toast.error('Failed to load HSE categories');
      }
    };

    fetchHseCategories();
  }, []);

  // Set form values when editing an existing threat
  useEffect(() => {
    if (threat) {
      form.reset({
        name: threat.name,
        code: threat.code,
        description: threat.description || '',
        hseCategoryId: threat.hseCategoryId,
        isActive: threat.isActive,
      });
    }
  }, [threat, form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (mode === 'create') {
        await threatService.create(data);
        toast.success('Threat created successfully');
      } else {
        await threatService.update(threat!.id, data);
        toast.success('Threat updated successfully');
      }
      navigate('/master/threats');
    } catch (error) {
      console.error('Error saving threat:', error);
      toast.error(`Failed to ${mode} threat`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Threat</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="hseCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HSE Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an HSE category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter threat name" {...field} />
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
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter threat code" {...field} />
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
                      placeholder="Enter threat description"
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
                      Enable or disable this threat
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
                onClick={() => navigate('/master/threats')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ThreatForm; 