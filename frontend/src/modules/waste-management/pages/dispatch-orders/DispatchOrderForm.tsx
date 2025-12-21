import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Loader2 } from 'lucide-react';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';

import { dispatchOrderService } from '../../services/wasteManagementService';
import { CreateDispatchOrderData, DispatchOrder, UpdateDispatchOrderData, GeneralStatusEnum } from '../../types/waste-management.types';

const formSchema = z.object({
  dispatchCode: z.string().min(1, 'Dispatch code is required'),
  dispatchDate: z.string().min(1, 'Date is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be positive'),
  memo: z.string().optional(),
  status: z.nativeEnum(GeneralStatusEnum).optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface DispatchOrderFormProps {
  mode: 'create' | 'edit';
}

export default function DispatchOrderForm({ mode }: DispatchOrderFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dispatchCode: '',
      dispatchDate: new Date().toISOString().split('T')[0],
      quantity: 0,
      memo: '',
      isActive: true,
      status: GeneralStatusEnum.SCHEDULED,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          const response = await dispatchOrderService.getById(id);
          const data = response.data as DispatchOrder;
          form.reset({
            dispatchCode: data.dispatchCode,
            dispatchDate: new Date(data.dispatchDate).toISOString().split('T')[0],
            quantity: data.quantity,
            memo: data.memo || '',
            status: data.status,
            isActive: data.isActive,
          });
        } catch (error) {
          toast.error('Failed to fetch data');
          navigate('/waste-management/dispatch-orders');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [id, mode, navigate, form]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      if (mode === 'create') {
        const submitData: CreateDispatchOrderData = {
          dispatchCode: data.dispatchCode,
          dispatchDate: new Date(data.dispatchDate).toISOString(),
          quantity: data.quantity,
          memo: data.memo,
          isActive: data.isActive,
        };
        await dispatchOrderService.create(submitData);
        toast.success('Dispatch order created successfully');
      } else if (id) {
        const submitData: UpdateDispatchOrderData = {
          dispatchCode: data.dispatchCode,
          dispatchDate: new Date(data.dispatchDate).toISOString(),
          quantity: data.quantity,
          memo: data.memo,
          isActive: data.isActive,
          status: data.status,
        };
        await dispatchOrderService.update(id, submitData);
        toast.success('Dispatch order updated successfully');
      }
      navigate('/waste-management/dispatch-orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Order</CardTitle>
        <CardDescription>Enter dispatch order information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dispatchCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispatch Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dispatchDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispatch Date *</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        type="date"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {mode === 'edit' && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(GeneralStatusEnum).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memo</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter memo or description" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/waste-management/dispatch-orders')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Order' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
