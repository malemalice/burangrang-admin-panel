import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/core/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { User, Phone, Mail, MapPin } from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import { CreateCustomerDTO } from '../types/customer.types';

// Lean validation schema - only essential fields
const customerQuickFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required').optional(),
}).refine(
  (data) => data.phone || data.email,
  {
    message: "Either phone or email is required",
    path: ["email"], // Show error on email field
  }
);

type CustomerQuickFormValues = z.infer<typeof customerQuickFormSchema>;

interface CustomerQuickFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: any) => void;
}

const CustomerQuickForm = ({ isOpen, onClose, onCustomerCreated }: CustomerQuickFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCustomer } = useCustomers();

  const form = useForm<CustomerQuickFormValues>({
    resolver: zodResolver(customerQuickFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    },
  });

  const onSubmit = async (data: CustomerQuickFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Clean up empty strings
      const customerData: CreateCustomerDTO = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
      };

      const newCustomer = await createCustomer(customerData);
      
      // Reset form
      form.reset();
      
      // Notify parent component
      onCustomerCreated(newCustomer);
      
      // Close dialog
      onClose();
      
      toast.success(`Customer "${newCustomer.user?.firstName} ${newCustomer.user?.lastName}" created successfully`);
      
    } catch (error) {
      console.error('Error creating customer:', error);
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Customer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Info Badge */}
          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Quick Add
                </Badge>
                <span>Only essential fields required. Additional details can be added later.</span>
              </div>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        First Name *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
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
                      <FormLabel className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Help Text */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Quick Setup:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Customer will be assigned default role and office</li>
                      <li>• Temporary password will be sent via email/SMS</li>
                      <li>• Additional details can be added later</li>
                    </ul>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? 'Creating...' : 'Create Customer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerQuickForm;
