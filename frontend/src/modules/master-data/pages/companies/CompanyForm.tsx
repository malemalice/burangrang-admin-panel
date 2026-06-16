import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Switch } from '@/core/components/ui/switch';
import { Textarea } from '@/core/components/ui/textarea';
import companyService from '../../services/companyService';
import { CompanyDTO, CreateCompanyDTO, UpdateCompanyDTO } from '../../types/master-data.types';

const formSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  code: z.string().min(1, 'Company code is required'),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().trim().regex(
    /^\+?[0-9]{7,15}$/,
    'Phone must contain only numbers (optionally starting with +), minimum 7 digits',
  ),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { message?: string | string[] } | undefined)?.message;
    if (typeof msg === 'string' && msg.trim() !== '') return msg;
    if (Array.isArray(msg) && msg.length > 0) return msg.join(', ');
  }
  if (error instanceof Error && error.message.trim() !== '') return error.message;
  return fallback;
}

interface CompanyFormProps {
  company?: CompanyDTO;
  mode: 'create' | 'edit';
}

const CompanyForm = ({ company, mode }: CompanyFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (!company || mode !== 'edit') {
      return;
    }

    setIsLoadingData(true);
    form.reset({
      name: company.name,
      code: company.code,
      address: company.address || '',
      contactPerson: company.contactPerson || '',
      phone: company.phone || '',
      email: company.email || '',
      isActive: company.isActive,
    });
    setIsLoadingData(false);
  }, [company, mode, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      if (mode === 'create') {
        const companyData: CreateCompanyDTO = {
          name: data.name,
          code: data.code,
          address: data.address || undefined,
          contactPerson: data.contactPerson || undefined,
          phone: data.phone,
          email: data.email || undefined,
          isActive: data.isActive,
        };

        await companyService.createCompany(companyData);
        toast.success('Company created successfully');
      } else if (company) {
        const companyData: UpdateCompanyDTO = {
          name: data.name,
          code: data.code,
          address: data.address || undefined,
          contactPerson: data.contactPerson || undefined,
          phone: data.phone,
          email: data.email || undefined,
          isActive: data.isActive,
        };

        await companyService.updateCompany(company.id, companyData);
        toast.success('Company updated successfully');
      }

      navigate('/master/companies');
    } catch (error: unknown) {
      console.error('Error saving company:', error);
      const errorMessage = getApiErrorMessage(error, `Failed to ${mode} company`);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Company</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Company Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
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
                    <FormLabel>
                      Company Code <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact person" {...field} />
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
                    <FormLabel>
                      Phone <span className="text-destructive">*</span>
                    </FormLabel>
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter company email" {...field} />
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
                    <Textarea placeholder="Enter company address" rows={3} {...field} />
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
                    <div className="text-sm text-muted-foreground">Set whether this company is active</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/master/companies')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {mode === 'create' ? 'Create Company' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CompanyForm;
