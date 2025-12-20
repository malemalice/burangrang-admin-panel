import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { ApprovalStatusHistory } from '@/modules/master-data';

interface ApprovalHistoryCardProps {
  approvalHistory: ApprovalStatusHistory | null;
  isLoading: boolean;
}

export const ApprovalHistoryCard = ({ approvalHistory, isLoading }: ApprovalHistoryCardProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!approvalHistory?.history.length) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-md bg-muted/20">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No approval history available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-1">Approval History</h3>
        <p className="text-xs text-muted-foreground">Track the approval progress</p>
      </div>
      
      <div className="relative max-h-[600px] overflow-y-auto pr-2">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-3">
          {approvalHistory.history.map((item) => (
            <div key={item.id} className="relative pl-6">
              <div className="absolute left-0 w-6 flex items-center justify-center">
                <div className={`w-2.5 h-2.5 rounded-full border-2 border-background ${
                  item.status === 'APPROVED' ? 'bg-green-500' : 
                  item.status === 'REJECTED' ? 'bg-red-500' : 
                  'bg-yellow-500'
                }`} />
              </div>
              <div className="bg-muted/30 border rounded-md p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <Badge 
                    variant={
                      item.status === 'APPROVED' ? 'default' :
                      item.status === 'REJECTED' ? 'destructive' :
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {item.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs mb-1.5 text-muted-foreground">{item.notes}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>By: {item.creator.name}</span>
                  <span>Dept: {item.department.name}</span>
                  <span>Pos: {item.jobPosition.name}</span>
                </div>
              </div>
            </div>
          ))}

          {approvalHistory.nextApprover && (
            <div className="relative pl-6">
              <div className="absolute left-0 w-6 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-background bg-blue-500 animate-pulse" />
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Waiting for Approval</p>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-blue-700 dark:text-blue-300">
                  <span>Dept: {approvalHistory.nextApprover.department.name}</span>
                  <span>Pos: {approvalHistory.nextApprover.jobPosition.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
