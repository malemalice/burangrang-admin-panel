import { useEffect, useState, useCallback } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/core/components/ui/dialog';
import { Plus, Trash2, Package, BookOpen, UserPlus, Search } from 'lucide-react';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { useOrder } from '../hooks/useOrders';
import { OrderFormData, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../types/order.types';
import ordersService from '../services/ordersService';
import customerService from '@/modules/customers/services/customerService';
import { Customer, CreateCustomerDTO } from '@/modules/customers/types/customer.types';
import productService from '@/modules/products/services/productService';
import { Product } from '@/modules/products/types/product.types';

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  subtotal: z.number().min(0, 'Subtotal must be positive'),
  taxAmount: z.number().min(0, 'Tax amount must be positive'),
  discountAmount: z.number().min(0, 'Discount amount must be positive'),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

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
      paymentStatus: 'PENDING',
      notes: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
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
        paymentStatus: order.paymentStatus,
        notes: order.notes || '',
        items: order.items?.map(item => ({
          productId: item.productId || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })) || [],
      });
    }
  }, [order, mode, form]);

  // Load customers with memoization to prevent infinite loops
  const loadCustomers = useCallback(async () => {
    try {
      const response = await customerService.getCustomers({
        page: 1,
        limit: 100, // Get all customers for dropdown
        sortBy: 'firstName',
        sortOrder: 'asc'
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast.error('Failed to load customers');
    }
  }, []);

  // Load products with memoization to prevent infinite loops
  const loadProducts = useCallback(async () => {
    try {
      const response = await productService.getProducts({
        page: 1,
        limit: 100, // Get all products for dropdown
        sortBy: 'name',
        sortOrder: 'asc',
        filters: { isActive: 'active' } // Only active products
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    }
  }, []);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setIsLoading(true);
        // Load customers and products for dropdowns
        await Promise.all([
          loadCustomers(),
          loadProducts()
        ]);
      } catch (error) {
        console.error('Failed to load form data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [loadCustomers, loadProducts]);

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

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      const finalPrice = selectedProduct.finalPrice || selectedProduct.price || 0;
      form.setValue(`items.${index}.unitPrice`, finalPrice);
      form.setValue(`items.${index}.productId`, productId);
      updateItemTotal(index);
    }
  };

  const addItem = () => {
    append({ productId: '', quantity: 1, unitPrice: 0, totalPrice: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      const items = form.getValues('items').filter((_, i) => i !== index);
      calculateTotals(items);
    }
  };

  // Create new customer function
  const createNewCustomer = async (customerData: CreateCustomerDTO) => {
    try {
      setIsCreatingCustomer(true);
      const newCustomer = await customerService.createCustomer(customerData);
      
      // Add new customer to the list
      setCustomers(prev => [newCustomer, ...prev]);
      
      // Auto-select the newly created customer
      form.setValue('customerId', newCustomer.id);
      
      // Close dialog
      setIsCustomerDialogOpen(false);
      
      toast.success('Customer created successfully and selected');
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast.error('Failed to create customer');
      throw error;
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      if (mode === 'create') {
        await ordersService.createOrder({
          customerId: data.customerId,
          status: data.status,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          discountAmount: data.discountAmount,
          totalAmount: data.totalAmount,
          currency: 'IDR', // Default to Indonesian Rupiah
          paymentStatus: data.paymentStatus,
          notes: data.notes,
          items: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          }))
        });
        toast.success('Order created successfully');
      } else if (id) {
        await ordersService.updateOrder(id, {
          status: data.status,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          discountAmount: data.discountAmount,
          totalAmount: data.totalAmount,
          paymentStatus: data.paymentStatus,
          notes: data.notes,
        });
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
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <SearchableSelect
                            options={customers.map(customer => ({
                              value: customer.id,
                              label: `${customer.user?.firstName || ''} ${customer.user?.lastName || ''}`.trim() || 'Unknown Customer'
                            }))}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Search and select customer..."
                            searchPlaceholder="Search customers by name..."
                            emptyText="No customers found. Create a new one?"
                          />
                        </div>
                        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="icon" title="Add new customer">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Add New Customer</DialogTitle>
                            </DialogHeader>
                            <CustomerQuickCreateForm
                              onSubmit={createNewCustomer}
                              isLoading={isCreatingCustomer}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
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
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product</FormLabel>
                              <SearchableSelect
                                options={products.map(product => ({
                                  value: product.id,
                                  label: product.name,
                                  subtitle: product.finalPrice ? `Rp ${product.finalPrice.toLocaleString('id-ID')}` : `Rp ${product.price.toLocaleString('id-ID')}`,
                                  icon: product.hasCourse ? <BookOpen className="h-4 w-4" /> : <Package className="h-4 w-4" />
                                }))}
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleProductSelect(index, value);
                                }}
                                placeholder="Search and select product..."
                                searchPlaceholder="Search products by name..."
                                emptyText="No products found"
                              />
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
                                  readOnly
                                  className="bg-gray-50"
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
                                      className="bg-gray-50"
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
                      <span>Rp {form.watch('subtotal').toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>Rp {form.watch('taxAmount').toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-Rp {form.watch('discountAmount').toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>Rp {form.watch('totalAmount').toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
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

// Quick Customer Creation Form Component
interface CustomerQuickCreateFormProps {
  onSubmit: (data: CreateCustomerDTO) => Promise<void>;
  isLoading: boolean;
}

const CustomerQuickCreateForm = ({ onSubmit, isLoading }: CustomerQuickCreateFormProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      toast.error('Either email or phone number is required');
      return;
    }

    try {
      await onSubmit({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      });
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="text-sm font-medium">
            First Name *
          </label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            placeholder="Enter first name"
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className="text-sm font-medium">
            Last Name *
          </label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            placeholder="Enter last name"
            required
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email address"
        />
      </div>
      
      <div>
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Enter phone number"
        />
      </div>
      
      <div className="text-xs text-gray-500">
        * Required fields. Either email or phone must be provided.
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {/* Dialog will be closed by parent */}}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Customer'}
        </Button>
      </div>
    </form>
  );
};

export default OrderForm;
