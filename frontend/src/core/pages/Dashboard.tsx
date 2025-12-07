import React, { useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from "@/core/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { 
  DollarSign, 
  ShoppingCart, 
  BookOpen, 
  Package, 
  Clock, 
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useAppName } from '@/modules/settings/hooks/useSettings';
import { useOrderStats } from '@/modules/orders';
import { useProductStats } from '@/modules/products';
import { useCourseStats } from '@/modules/courses';
import { useOrders } from '@/modules/orders';
import { formatCurrencyDisplay } from '@/shared/utils/currency';
import { getOrderStatusColor } from '@/modules/orders';

// Memoized Stat Card Component for performance
const StatCard = React.memo<{
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  positive?: boolean;
  isLoading?: boolean;
}>(({ title, value, icon: Icon, change, positive, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${positive ? 'text-green-600' : 'text-red-600'} mt-1 flex items-center`}>
            {change}
            {positive ? (
              <ArrowUpRight className="w-3 h-3 ml-1" />
            ) : (
              <ArrowDownRight className="w-3 h-3 ml-1" />
            )}
            {' '}vs last month
          </p>
        )}
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

// Memoized Recent Order Item Component
const RecentOrderItem = React.memo<{
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  status: string;
  orderDate: string;
  onClick: () => void;
}>(({ orderNumber, customerName, totalAmount, currency, status, orderDate, onClick }) => {
  const formattedDate = useMemo(() => {
    const date = new Date(orderDate);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }, [orderDate]);

  return (
    <div 
      className="flex items-center justify-between gap-4 pb-4 border-b last:border-0 last:pb-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium truncate">{orderNumber}</p>
          <Badge variant="outline" className={`${getOrderStatusColor(status as any)} border-0 text-xs`}>
            {status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{customerName}</p>
        <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{formatCurrencyDisplay(totalAmount, currency)}</p>
      </div>
    </div>
  );
});

RecentOrderItem.displayName = 'RecentOrderItem';

const Dashboard = () => {
  const navigate = useNavigate();
  const { appName } = useAppName();
  
  // Fetch statistics with proper hooks following TRD patterns
  const { stats: orderStats, isLoading: orderStatsLoading } = useOrderStats();
  const { stats: productStats, isLoading: productStatsLoading } = useProductStats();
  const { stats: courseStats, isLoading: courseStatsLoading } = useCourseStats();
  
  // Fetch recent orders
  const { orders, isLoading: ordersLoading, fetchOrders } = useOrders();

  // Fetch recent orders on mount
  useEffect(() => {
    fetchOrders({
      page: 1,
      limit: 5,
      sortBy: 'orderDate',
      sortOrder: 'desc',
    });
  }, [fetchOrders]);

  // Memoize stat cards data to prevent unnecessary recalculations
  const statCards = useMemo(() => {
    const isLoading = orderStatsLoading || productStatsLoading || courseStatsLoading;
    
    return [
      {
        title: "Total Revenue",
        value: orderStats?.totalRevenue 
          ? formatCurrencyDisplay(orderStats.totalRevenue) 
          : "Rp 0",
        icon: DollarSign,
        change: orderStats?.monthlyRevenue 
          ? `+${formatCurrencyDisplay(orderStats.monthlyRevenue)}` 
          : undefined,
        positive: true,
        isLoading,
      },
      {
        title: "Total Orders",
        value: orderStats?.totalOrders?.toString() || "0",
        icon: ShoppingCart,
        change: orderStats?.fulfilledOrders 
          ? `${Math.round((orderStats.fulfilledOrders / (orderStats.totalOrders || 1)) * 100)}% fulfilled`
          : undefined,
        positive: true,
        isLoading,
      },
      {
        title: "Active Courses",
        value: courseStats?.published?.toString() || "0",
        icon: BookOpen,
        change: courseStats?.total 
          ? `${Math.round((courseStats.published / (courseStats.total || 1)) * 100)}% published`
          : undefined,
        positive: true,
        isLoading,
      },
      {
        title: "Total Products",
        value: productStats?.total?.toString() || "0",
        icon: Package,
        change: productStats?.active 
          ? `${Math.round((productStats.active / (productStats.total || 1)) * 100)}% active`
          : undefined,
        positive: true,
        isLoading,
      },
    ];
  }, [orderStats, productStats, courseStats, orderStatsLoading, productStatsLoading, courseStatsLoading]);

  // Memoize order summary stats
  const orderSummary = useMemo(() => {
    if (!orderStats) return null;
    
    return [
      {
        label: "Pending",
        value: orderStats.pendingOrders || 0,
        icon: Clock,
        color: "text-yellow-600",
      },
      {
        label: "Fulfilled",
        value: orderStats.fulfilledOrders || 0,
        icon: CheckCircle2,
        color: "text-green-600",
      },
      {
        label: "Payment Pending",
        value: orderStats.paymentPendingOrders || 0,
        icon: Clock,
        color: "text-blue-600",
      },
    ];
  }, [orderStats]);

  const handleOrderClick = useCallback((orderId: string) => {
    navigate(`/orders/${orderId}`);
  }, [navigate]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome to ${appName} - LMS Ecommerce Platform`}
      />
      
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            change={card.change}
            positive={card.positive}
            isLoading={card.isLoading}
          />
        ))}
      </div>

      {/* Order Summary Cards */}
      {orderSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {orderSummary.map((summary, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{summary.label} Orders</CardTitle>
                <summary.icon className={`h-5 w-5 ${summary.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {orderStats?.totalOrders 
                    ? `${Math.round((summary.value / orderStats.totalOrders) * 100)}% of total`
                    : '0% of total'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Recent Orders and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <button
                onClick={() => navigate('/orders')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-2">
                {orders.map((order) => (
                  <RecentOrderItem
                    key={order.id}
                    orderNumber={order.orderNumber}
                    customerName={order.customer?.user 
                      ? `${order.customer.user.firstName} ${order.customer.user.lastName}`
                      : order.customer?.user?.email || 'Unknown Customer'}
                    totalAmount={order.totalAmount}
                    currency={order.currency}
                    status={order.status}
                    orderDate={order.orderDate}
                    onClick={() => handleOrderClick(order.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No orders yet</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Insights</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderStats && (
                <>
                  <div className="pb-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">Monthly Revenue</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrencyDisplay(orderStats.monthlyRevenue || 0)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {orderStats.totalRevenue 
                        ? `${Math.round((orderStats.monthlyRevenue || 0) / orderStats.totalRevenue * 100)}% of total revenue`
                        : '0% of total revenue'}
                    </p>
                  </div>
                  
                  <div className="pb-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">Fulfillment Rate</p>
                      <p className="text-sm font-semibold">
                        {orderStats.totalOrders 
                          ? `${Math.round((orderStats.fulfilledOrders / orderStats.totalOrders) * 100)}%`
                          : '0%'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {orderStats.fulfilledOrders} out of {orderStats.totalOrders} orders fulfilled
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">Active Products</p>
                      <p className="text-sm font-semibold">
                        {productStats?.active || 0} / {productStats?.total || 0}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {productStats?.totalViews 
                        ? `${productStats.totalViews.toLocaleString()} total views`
                        : 'No views yet'}
                    </p>
                  </div>
                </>
              )}
              
              {(!orderStats && !productStats && !courseStats) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Loading insights...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
