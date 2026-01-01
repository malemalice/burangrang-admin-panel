import { Badge } from '@/core/components/ui/badge';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

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

