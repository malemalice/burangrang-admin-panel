import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, ArrowLeft, Package, User, CreditCard, MapPin, FileText, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { useOrder } from '../hooks/useOrders';
import { getOrderStatusColor, getPaymentStatusColor } from '../types/order.types';

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error } = useOrder(id || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
            <p className="text-gray-600">
              Created on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${getOrderStatusColor(order.status)} border-0`}>
            {order.status}
          </Badge>
          <Badge variant="outline" className={`${getPaymentStatusColor(order.paymentStatus)} border-0`}>
            {order.paymentStatus}
          </Badge>
          <Button onClick={() => navigate(`/orders/${order.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.product ? (
                          <Package className="h-6 w-6 text-gray-600" />
                        ) : (
                          <FileText className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {item.product?.name || item.course?.title || 'Unknown Item'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.product ? 'Product' : 'Course'} • Qty: {item.quantity}
                        </p>
                        {item.course?.instructor && (
                          <p className="text-sm text-gray-500">
                            Instructor: {item.course.instructor.firstName} {item.course.instructor.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.unitPrice.toFixed(2)} each</p>
                      <p className="text-lg font-bold">${item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${order.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${order.totalAmount.toFixed(2)} {order.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          {(order.shippingAddress || order.billingAddress) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.shippingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{order.shippingAddress}</p>
                  </CardContent>
                </Card>
              )}

              {order.billingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{order.billingAddress}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.customer ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">
                      {order.customer.user?.firstName} {order.customer.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{order.customer.user?.email}</p>
                  </div>
                  {order.customer.phone && (
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-gray-600">{order.customer.phone}</p>
                    </div>
                  )}
                  {order.customer.address && (
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-gray-600">{order.customer.address}</p>
                      {order.customer.city && order.customer.state && (
                        <p className="text-sm text-gray-600">
                          {order.customer.city}, {order.customer.state} {order.customer.postalCode}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Customer information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Order Created</p>
                    <p className="text-xs text-gray-600">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {order.status !== 'PENDING' && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Status: {order.status}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(order.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {order.paymentStatus === 'PAID' && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Payment Completed</p>
                      <p className="text-xs text-gray-600">
                        {order.payments?.[0]?.processedAt 
                          ? new Date(order.payments[0].processedAt).toLocaleString()
                          : 'Recently'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {order.payments && order.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">Transaction ID</p>
                          <p className="text-xs text-gray-600 font-mono">{payment.transactionId}</p>
                        </div>
                        <Badge variant="outline" className={`${getPaymentStatusColor(payment.status as any)} border-0`}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium">Amount</p>
                        <p className="text-sm text-gray-600">
                          {payment.currency} {payment.amount.toFixed(2)}
                        </p>
                      </div>
                      {payment.processedAt && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Processed: {new Date(payment.processedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
