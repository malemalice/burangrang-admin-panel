import { Badge } from '@/core/components/ui/badge';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

/**
 * Get risk badge component based on rating
 */
export const getRiskBadge = (rating: string) => {
  const colorMap: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800 border-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-800',
    CRITICAL: 'bg-red-100 text-red-800 border-red-800',
    EXTREME: 'bg-purple-100 text-purple-800 border-purple-800',
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colorMap[rating] || 'bg-gray-100 text-gray-800 border-gray-800'}`}>
      {rating}
    </span>
  );
};

/**
 * Get status badge component based on status
 */
export const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    [GeneralStatusEnum.SCHEDULED]: { label: 'Scheduled', variant: 'outline' },
    [GeneralStatusEnum.DRAFT]: { label: 'Draft', variant: 'outline' },
    [GeneralStatusEnum.OPEN]: { label: 'Open', variant: 'secondary' },
    [GeneralStatusEnum.WAITING_APPROVAL]: { label: 'Waiting Approval', variant: 'secondary' },
    [GeneralStatusEnum.DONE]: { label: 'Done', variant: 'default' },
    [GeneralStatusEnum.REJECTED]: { label: 'Rejected', variant: 'destructive' },
  };

  const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

  return (
    <Badge variant={statusInfo.variant}>
      {statusInfo.label}
    </Badge>
  );
};
