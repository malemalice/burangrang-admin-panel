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
import { useProductTypes } from '../hooks/useProductTypes';
import { CreateProductTypeDTO, UpdateProductTypeDTO } from '../types/product-types.types';
import { ProductType } from '../services/productTypesService';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductTypeFormProps {
  productType?: ProductType;
  mode: 'create' | 'edit';
}

const ProductTypeForm = ({ productType, mode }: ProductTypeFormProps) => {
  const navigate = useNavigate();
  const { createProductType, updateProductType } = useProductTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (productType && mode === 'edit') {
      form.reset({
        name: productType.name,
        description: productType.description || '',
        isActive: productType.status === 'active',
      });
    }
  }, [productType, mode, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      if (mode === 'create') {
        const createData: CreateProductTypeDTO = {
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
        };
        await createProductType(createData);
        toast.success('Product type created successfully');
      } else if (productType) {
        const updateData: UpdateProductTypeDTO = {
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
        };
        await updateProductType(productType.id, updateData);
        toast.success('Product type updated successfully');
      }

      navigate('/product-types');
    } catch (error) {
      console.error('Error saving product type:', error);
      toast.error(`Failed to ${mode} product type`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create' : 'Edit'} Product Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter product type name" 
                        {...field} 
                        disabled={isSubmitting}
                      />
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
                        placeholder="Enter product type description (optional)" 
                        {...field} 
                        disabled={isSubmitting}
                        rows={4}
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Whether this product type is active and available for use
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/product-types')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                    : (mode === 'create' ? 'Create Product Type' : 'Save Changes')
                  }
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductTypeForm;
