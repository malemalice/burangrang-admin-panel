import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Plus, Trash2, Package, BookOpen } from 'lucide-react';
import { useOrder } from '../hooks/useOrders';
import { OrderFormData, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../types/order.types';
import ordersService from '../services/ordersService';

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  subtotal: z.number().min(0, 'Subtotal must be positive'),
  taxAmount: z.number().min(0, 'Tax amount must be positive'),
  discountAmount: z.number().min(0, 'Discount amount must be positive'),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']),
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    courseId: z.string().optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    totalPrice: z.number().min(0, 'Total price must be positive'),
  })).min(1, 'At least one item is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface OrderFormProps {
  mode: 'create' | 'edit';
}

const OrderForm = ({ mode }: OrderFormProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const { order, isLoading: isLoadingOrder } = useOrder(mode === 'edit' ? id || null : null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      status: 'PENDING',
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      currency: 'USD',
      paymentStatus: 'PENDING',
      shippingAddress: '',
      billingAddress: '',
      notes: '',
      items: [{ productId: '', courseId: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (order && mode === 'edit') {
      form.reset({
        customerId: order.customerId,
        status: order.status,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress || '',
        billingAddress: order.billingAddress || '',
        notes: order.notes || '',
        items: order.items?.map(item => ({
          productId: item.productId || '',
          courseId: item.courseId || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })) || [],
      });
    }
  }, [order, mode, form]);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setIsLoading(true);
        // Load customers, products, and courses for dropdowns
        // This would typically be done through separate API calls
        setCustomers([]);
        setProducts([]);
        setCourses([]);
      } catch (error) {
        console.error('Failed to load form data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, []);

  const calculateTotals = (items: FormValues['items']) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * 0.08; // 8% tax
    const discountAmount = 0; // Could be calculated based on business rules
    const totalAmount = subtotal + taxAmount - discountAmount;

    form.setValue('subtotal', subtotal);
    form.setValue('taxAmount', taxAmount);
    form.setValue('discountAmount', discountAmount);
    form.setValue('totalAmount', totalAmount);
  };

  const updateItemTotal = (index: number) => {
    const items = form.getValues('items');
    const item = items[index];
    if (item) {
      const totalPrice = item.quantity * item.unitPrice;
      form.setValue(`items.${index}.totalPrice`, totalPrice);
      calculateTotals(items.map((it, i) => i === index ? { ...it, totalPrice } : it));
    }
  };

  const addItem = () => {
    append({ productId: '', courseId: '', quantity: 1, unitPrice: 0, totalPrice: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      const items = form.getValues('items').filter((_, i) => i !== index);
      calculateTotals(items);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      if (mode === 'create') {
        await ordersService.createOrder(data);
        toast.success('Order created successfully');
      } else if (id) {
        await ordersService.updateOrder(id, data);
        toast.success('Order updated successfully');
      }
      
      navigate('/orders');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(`Failed to ${mode} order`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingOrder && mode === 'edit') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Order</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.user?.firstName} {customer.user?.lastName}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ORDER_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="USD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Order Items</h3>
                  <Button type="button" onClick={addItem} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        {product.name}
                                      </div>
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
                          name={`items.${index}.courseId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        {course.title}
                                      </div>
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
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseInt(e.target.value) || 1);
                                    updateItemTotal(index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                    updateItemTotal(index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <FormField
                              control={form.control}
                              name={`items.${index}.totalPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Total Price</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      {...field}
                                      readOnly
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeItem(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Totals */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Totals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${form.watch('subtotal').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${form.watch('taxAmount').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-${form.watch('discountAmount').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${form.watch('totalAmount').toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Addresses and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter shipping address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter billing address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter order notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/orders')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {mode === 'create' ? 'Create Order' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderForm;
