import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { RiskAssessment } from '@/core/lib/types';

interface AssessmentDetailsCardProps {
  assessment: RiskAssessment;
}

export const AssessmentDetailsCard = ({ assessment }: AssessmentDetailsCardProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-3">Assessment Details</h3>
      </div>
      
      {assessment.description && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Description</p>
          <p className="text-sm">{assessment.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Department</p>
          <p className="text-sm">{assessment.department?.name || 'N/A'}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Assessment Date</p>
          <p className="text-sm">
            {assessment.assessmentDate 
              ? format(new Date(assessment.assessmentDate), 'dd MMM yyyy') 
              : 'N/A'}
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Assignee</p>
          <p className="text-sm">{assessment.assignee ? `${assessment.assignee.firstName} ${assessment.assignee.lastName}` : 'N/A'}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Created By</p>
          <p className="text-sm">{assessment.creator ? `${assessment.creator.firstName} ${assessment.creator.lastName}` : assessment.createdBy || 'N/A'}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Created At</p>
          <p className="text-sm">{format(new Date(assessment.createdAt), 'dd MMM yyyy')}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
          <p className="text-sm">{format(new Date(assessment.updatedAt), 'dd MMM yyyy')}</p>
        </div>
      </div>

      {assessment.actionPlan && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Action Plan</p>
          <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: assessment.actionPlan }} />
        </div>
      )}
    </div>
  );
};
