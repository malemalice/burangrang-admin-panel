import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { Textarea } from '@/core/components/ui/textarea';
import companyService from '@/modules/master-data/services/companyService';
import type { CompanyDTO } from '@/modules/master-data/types/master-data.types';

function suggestCompanyCodeFromQuery(query: string): string {
  const cleaned = query.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleaned.slice(0, 32) || 'COMPANY';
}

const formSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  code: z.string().min(1, 'Company code is required'),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (company: CompanyDTO) => void;
  /** Pre-fill name (and suggested code) when opened from combobox search */
  initialName?: string;
}

const AddCompanyModal = ({
  open,
  onOpenChange,
  onSuccess,
  initialName = '',
}: AddCompanyModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
    },
  });

  const defaultReset = useMemo(
    () => ({
      name: '',
      code: '',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
    }),
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const trimmed = initialName.trim();
    if (trimmed) {
      form.reset({
        ...defaultReset,
        name: trimmed,
        code: suggestCompanyCodeFromQuery(trimmed),
      });
    } else {
      form.reset(defaultReset);
    }
  }, [open, initialName, form, defaultReset]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const company = await companyService.createCompany({
        name: data.name.trim(),
        code: data.code.trim(),
        address: data.address?.trim() || undefined,
        contactPerson: data.contactPerson?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        isActive: true,
      });
      toast.success('Company created successfully');
      onSuccess(company);
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create company';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add new company</DialogTitle>
          <DialogDescription>
            Enter the company details. Name and code are required; code must be unique.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Company name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Company name" {...field} />
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
                    Company code <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Unique code" autoComplete="off" {...field} />
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
                    <Textarea placeholder="Address" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact person</FormLabel>
                  <FormControl>
                    <Input placeholder="Contact person" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create company'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyModal;
