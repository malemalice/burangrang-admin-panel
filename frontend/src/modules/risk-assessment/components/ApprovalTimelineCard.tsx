import { format } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Circle } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { ApprovalStatusHistory } from '@/modules/master-data';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

// Sentinel values for dynamic approval fields
const APPROVAL_FIELD_MARKERS = {
  FROM_ENTITY_DEPARTMENT: '@ENTITY_DEPARTMENT',
  FROM_ENTITY_JOB_POSITION: '@ENTITY_JOB_POSITION',
} as const;

// Helper function to get display label (handles sentinel values - backend should already return labels, but this is a fallback)
const getDisplayLabel = (value: string, fallback: string): string => {
  if (value === APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT) {
    return 'Dynamic: From Entity Data';
  }
  if (value === APPROVAL_FIELD_MARKERS.FROM_ENTITY_JOB_POSITION) {
    return 'Dynamic: From Entity Data (Department Head)';
  }
  return fallback;
};

interface ApprovalTimelineCardProps {
  approvalHistory: ApprovalStatusHistory | null;
  isLoading: boolean;
  assessmentStatus?: string; // Assessment status to check if DONE
}

export const ApprovalTimelineCard = ({ approvalHistory, isLoading, assessmentStatus }: ApprovalTimelineCardProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize scroll dimensions on mount and when content changes
  useEffect(() => {
    const updateScrollDimensions = () => {
      if (scrollRef.current) {
        setScrollHeight(scrollRef.current.scrollHeight);
        setClientHeight(scrollRef.current.clientHeight);
        setScrollTop(scrollRef.current.scrollTop);
      }
    };

    updateScrollDimensions();
    // Update dimensions when content changes
    const timeoutId = setTimeout(updateScrollDimensions, 100);
    
    return () => clearTimeout(timeoutId);
  }, [approvalHistory, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 h-full">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Loading approval timeline...</span>
        </div>
      </div>
    );
  }

  // Show empty state only if no approval lines are configured
  if (!approvalHistory || !approvalHistory.allApprovalLines || approvalHistory.allApprovalLines.length === 0) {
    return (
      <div className="flex items-center gap-3 p-6 border rounded-md bg-muted/20 h-full">
        <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">No approval workflow</p>
          <p className="text-xs text-muted-foreground mt-0.5">No approval workflow is configured for this entity.</p>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          badge: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          dot: 'bg-green-500',
        };
      case 'REJECTED':
        return {
          badge: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          iconColor: 'text-red-600',
          dot: 'bg-red-500',
        };
      default:
        return {
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: AlertCircle,
          iconColor: 'text-yellow-600',
          dot: 'bg-yellow-500',
        };
    }
  };

  // Check if assessment status is DONE - if so, don't show current workflow
  const isDone = assessmentStatus === GeneralStatusEnum.DONE;
  
  // Get all approvals sorted by createdAt (chronological order)
  const allApprovals = approvalHistory.history?.slice().sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  ) || [];

  // Find completed approvals for each line
  const getApprovalForLine = (lineNumber: number) => {
    return allApprovals.find((item) => item.line === lineNumber);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h3 className="text-base font-semibold text-foreground mb-1">Approval Timeline</h3>
        <p className="text-xs text-muted-foreground">Track the approval progress and workflow</p>
      </div>
      
      <div className="relative">
        {/* Scrollable content */}
        <div 
          ref={scrollRef}
          className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30 max-h-[400px]"
          onScroll={(e) => {
            const target = e.target as HTMLElement;
            setScrollTop(target.scrollTop);
            setScrollHeight(target.scrollHeight);
            setClientHeight(target.clientHeight);
          }}
        >
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-4 pb-4">
              {/* Show all approvals in chronological order */}
              {allApprovals.map((approval) => {
                const statusConfig = getStatusConfig(approval.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={approval.id} className="relative pl-8">
                    <div className="absolute left-0 w-8 flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full border-2 border-background ${statusConfig.dot}`} />
                    </div>
                    <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <StatusIcon className={`h-4 w-4 ${statusConfig.iconColor} flex-shrink-0`} />
                          <Badge 
                            variant="outline"
                            className={`text-xs font-medium border ${statusConfig.badge}`}
                          >
                            {approval.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(approval.createdAt), 'dd MMM yyyy HH:mm')}
                        </span>
                      </div>
                      
                      {approval.notes && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">{approval.notes}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">By:</span>
                          <span className="font-medium text-foreground">{approval.creator.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Dept:</span>
                          <span className="font-medium text-foreground">{approval.department.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Pos:</span>
                          <span className="font-medium text-foreground">{approval.jobPosition.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Show current workflow approval lines only if not DONE (only pending/current, not completed) */}
              {!isDone && approvalHistory.allApprovalLines.map((line) => {
                const approval = getApprovalForLine(line.line);
                const isCompleted = line.status === 'completed';
                const isCurrent = line.status === 'current';
                const isPending = line.status === 'pending';

                // Skip completed lines - they're already shown in approvals above
                if (isCompleted) {
                  return null;
                }

                if (isCurrent) {
                  // Show current approval waiting
                  return (
                    <div key={`line-${line.line}`} className="relative pl-8">
                      <div className="absolute left-0 w-8 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full border-2 border-background bg-blue-500 animate-pulse" />
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 border rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Waiting for Approval</p>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-blue-700 dark:text-blue-300">Dept:</span>
                            <span className="font-medium text-blue-900 dark:text-blue-100">{line.department.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-blue-700 dark:text-blue-300">Pos:</span>
                            <span className="font-medium text-blue-900 dark:text-blue-100">{line.jobPosition.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else if (isPending) {
                  // Show pending approval (not yet reached)
                  return (
                    <div key={`line-${line.line}`} className="relative pl-8">
                      <div className="absolute left-0 w-8 flex items-center justify-center">
                        <Circle className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="bg-muted/20 border border-dashed rounded-lg p-4 opacity-60">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs font-medium text-muted-foreground">Pending</p>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>Dept:</span>
                            <span className="font-medium">{line.department.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>Pos:</span>
                            <span className="font-medium">{line.jobPosition.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
               })}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
