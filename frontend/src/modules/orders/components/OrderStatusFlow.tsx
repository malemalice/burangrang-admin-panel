import { CheckCircle, Clock, AlertCircle, XCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';

// Digital product order status flow (removed delivery-related statuses)
const ORDER_STATUS_FLOW = [
  {
    status: 'PENDING',
    label: 'Pending',
    description: 'Order received, awaiting payment confirmation',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600'
  },
  {
    status: 'CONFIRMED',
    label: 'Confirmed',
    description: 'Payment confirmed, preparing digital access',
    icon: CheckCircle,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600'
  },
  {
    status: 'PROCESSING',
    label: 'Processing',
    description: 'Setting up digital product access',
    icon: AlertCircle,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    iconColor: 'text-purple-600'
  },
  {
    status: 'CANCELLED',
    label: 'Cancelled',
    description: 'Order cancelled by customer or system',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600'
  },
  {
    status: 'REFUNDED',
    label: 'Refunded',
    description: 'Order refunded, access revoked',
    icon: XCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    iconColor: 'text-gray-600'
  }
] as const;

interface OrderStatusFlowProps {
  className?: string;
}

const OrderStatusFlow = ({ className = '' }: OrderStatusFlowProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Order Status Flow
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Understanding the digital product order lifecycle
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {ORDER_STATUS_FLOW.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === ORDER_STATUS_FLOW.length - 1;
            
            return (
              <div key={step.status} className="flex items-center">
                {/* Status Step */}
                <div className="flex flex-col items-center text-center max-w-[120px]">
                  <div className={`p-3 rounded-full border-2 ${step.color} mb-2`}>
                    <Icon className={`h-5 w-5 ${step.iconColor}`} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">{step.label}</h4>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Arrow (except for last item) */}
                {!isLast && (
                  <div className="flex items-center justify-center mx-4">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Additional Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-full bg-primary/10">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">
                Digital Product Delivery
              </p>
              <p className="text-muted-foreground">
                Once confirmed and processed, customers receive immediate access to their digital products 
                (courses, ebooks, videos) through their account dashboard.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderStatusFlow;
