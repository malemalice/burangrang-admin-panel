import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, MoreHorizontal, Package, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/core/components/ui/dropdown-menu';
import { useOrders, useOrderStats } from '../hooks/useOrders';
import { Order, OrderSearchParams, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, getOrderStatusColor, getPaymentStatusColor } from '../types/order.types';
import { formatCurrencyDisplay } from '@/shared/utils/currency';
import { FilterValue } from '@/core/components/ui/filter-drawer';
import OrderStatusFlow from '../components/OrderStatusFlow';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { 
    orders, 
    totalOrders, 
    currentPage, 
    isLoading, 
    error, 
    fetchOrders, 
    deleteOrder 
  } = useOrders();

  const { stats, isLoading: statsLoading } = useOrderStats();

  // ✅ CRITICAL: Use separate pagination state for UI
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);

  // ✅ CRITICAL: Memoize data loading function
  const loadOrders = useCallback(async () => {
    const params: OrderSearchParams = {
      page: pageIndex + 1,
      limit,
      search: searchTerm || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...Object.fromEntries(
        activeFilters.map(filter => [filter.id, filter.value])
      ),
    };

    await fetchOrders(params);
  }, [pageIndex, limit, searchTerm, activeFilters, fetchOrders]);

  // ✅ CRITICAL: Single useEffect for data loading
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // ✅ CRITICAL: Separate useEffect for initial data (stats)
  useEffect(() => {
    // Stats are loaded automatically by useOrderStats hook
  }, []); // Empty dependency array - run once on mount

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setPageIndex(0); // Reset to first page when searching
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    setActiveFilters(filters);
    setPageIndex(0); // Reset to first page when filtering
  };

  const handleDelete = async (order: Order) => {
    if (window.confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) {
      try {
        await deleteOrder(order.id);
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const handleStatusChange = async (order: Order, newStatus: string) => {
    try {
      // This would be handled by the updateOrderStatus function
      // For now, we'll just show a message
      console.log(`Changing order ${order.orderNumber} status to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Define columns with consistent structure
  const columns = [
    {
      id: 'orderNumber',
      header: 'Order Number',
      cell: (order: Order) => (
        <div className="flex items-center gap-3">
          <Package className="h-4 w-4 text-gray-500" />
          <div>
            <div className="font-medium">{order.orderNumber}</div>
            <div className="text-sm text-gray-500">
              {new Date(order.orderDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: (order: Order) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium">
              {order.customer?.user?.firstName?.[0] || 'C'}
            </span>
          </div>
          <div>
            <div className="font-medium">
              {order.customer?.user ? 
                `${order.customer.user.firstName} ${order.customer.user.lastName}` : 
                'Unknown Customer'
              }
            </div>
            <div className="text-sm text-gray-500">{order.customer?.user?.email}</div>
          </div>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'items',
      header: 'Items',
      cell: (order: Order) => (
        <div className="text-sm">
          <div className="font-medium">{order.items?.length || 0} items</div>
          <div className="text-gray-500">
            {order.items?.map(item => item.product?.name || item.course?.title).join(', ')}
          </div>
        </div>
      ),
      isSortable: false
    },
    {
      id: 'totalAmount',
      header: 'Total',
      cell: (order: Order) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatCurrencyDisplay(order.totalAmount, order.currency)}
          </span>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (order: Order) => (
        <Badge variant="outline" className={`${getOrderStatusColor(order.status)} border-0`}>
          {order.status}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'paymentStatus',
      header: 'Payment',
      cell: (order: Order) => (
        <Badge variant="outline" className={`${getPaymentStatusColor(order.paymentStatus)} border-0`}>
          {order.paymentStatus}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (order: Order) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatusChange(order, 'CONFIRMED')}>
              <CheckCircle className="mr-2 h-4 w-4" /> Confirm
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(order, 'PROCESSING')}>
              <Clock className="mr-2 h-4 w-4" /> Process
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(order, 'CANCELLED')}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(order)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false
    }
  ];

  // Define filter fields for dropdowns and search
  const filterFields = [
    {
      id: 'orderNumber',
      label: 'Order Number',
      type: 'text' as const
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: ORDER_STATUS_OPTIONS.map(option => ({ label: option.label, value: option.value }))
    },
    {
      id: 'paymentStatus',
      label: 'Payment Status',
      type: 'select' as const,
      options: PAYMENT_STATUS_OPTIONS.map(option => ({ label: option.label, value: option.value }))
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders and track their status"
        actions={
          <Button onClick={() => navigate('/orders/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create Order
          </Button>
        }
      />

        {/* Order Status Flow */}
        <OrderStatusFlow />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  stats?.totalOrders || 0
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                ) : (
                  formatCurrencyDisplay(stats?.totalRevenue)
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  stats?.pendingOrders || 0
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  stats?.processingOrders || 0
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalOrders / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalOrders
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default OrdersPage;
