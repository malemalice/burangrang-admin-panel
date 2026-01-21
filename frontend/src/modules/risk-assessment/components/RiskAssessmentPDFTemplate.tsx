import { format } from 'date-fns';
import { RiskAssessment, RiskAssessmentItem } from '@/core/lib/types';
import { ApprovalStatusHistory } from '@/modules/master-data';
import { getRiskBadge } from '../utils/riskBadgeHelpers';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { CheckCircle2, XCircle, AlertCircle, Clock, Circle } from 'lucide-react';

interface RiskAssessmentPDFTemplateProps {
  assessment: RiskAssessment;
  items: RiskAssessmentItem[];
  approvalHistory: ApprovalStatusHistory | null;
}

export const RiskAssessmentPDFTemplate = ({
  assessment,
  items,
  approvalHistory,
}: RiskAssessmentPDFTemplateProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          badge: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          dot: 'bg-green-500',
          label: 'APPROVED',
        };
      case 'REJECTED':
        return {
          badge: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          iconColor: 'text-red-600',
          dot: 'bg-red-500',
          label: 'REJECTED',
        };
      default:
        return {
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: AlertCircle,
          iconColor: 'text-yellow-600',
          dot: 'bg-yellow-500',
          label: 'PENDING',
        };
    }
  };

  // Get all approvals sorted by createdAt (chronological order)
  const allApprovals = approvalHistory?.history?.slice().sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  ) || [];

  const isDone = assessment.status === GeneralStatusEnum.DONE;

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Risk Assessment: {assessment.code}
        </h1>
        <p className="text-sm text-gray-600">
          Created on {format(new Date(assessment.createdAt), 'dd MMM yyyy')}
        </p>
      </div>

      {/* Assessment Details Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Assessment Details
        </h2>
        
        {assessment.description && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
            <p className="text-sm text-gray-900">{assessment.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Department</p>
            <p className="text-sm text-gray-900">{assessment.department?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Assessment Date</p>
            <p className="text-sm text-gray-900">
              {assessment.assessmentDate 
                ? format(new Date(assessment.assessmentDate), 'dd MMM yyyy') 
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Assignee</p>
            <p className="text-sm text-gray-900">
              {assessment.assignee 
                ? `${assessment.assignee.firstName} ${assessment.assignee.lastName}` 
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Created By</p>
            <p className="text-sm text-gray-900">
              {assessment.creator 
                ? `${assessment.creator.firstName} ${assessment.creator.lastName}` 
                : assessment.createdBy || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Created At</p>
            <p className="text-sm text-gray-900">
              {format(new Date(assessment.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Last Updated</p>
            <p className="text-sm text-gray-900">
              {format(new Date(assessment.updatedAt), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {assessment.actionPlan && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-1">Action Plan</p>
            <div 
              className="text-sm text-gray-900 prose prose-sm max-w-none" 
              dangerouslySetInnerHTML={{ __html: assessment.actionPlan }} 
            />
          </div>
        )}
      </div>

      {/* Risk Assessment Items Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Risk Assessment Items
        </h2>
        
        {items.length === 0 ? (
          <p className="text-sm text-gray-600">No risk assessment items found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    No
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Risk Category
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Risk
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Risk Matrix Rating
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Interpretation
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Post Risk Matrix Rating
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Post Interpretation
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {item.mRiskCategory
                        ? `${item.mRiskCategory.code} - ${item.mRiskCategory.name}`
                        : 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {item.mRisk
                        ? `${item.mRisk.code} - ${item.mRisk.name}`
                        : 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {item.riskMatrixRating || 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.interpretation === 'LOW' ? 'bg-green-100 text-green-800' :
                        item.interpretation === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        item.interpretation === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        item.interpretation === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        item.interpretation === 'EXTREME' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.interpretation}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {item.postRiskMatrixRating || 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">
                      {item.postInterpretation ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.postInterpretation === 'LOW' ? 'bg-green-100 text-green-800' :
                          item.postInterpretation === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          item.postInterpretation === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          item.postInterpretation === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          item.postInterpretation === 'EXTREME' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.postInterpretation}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Timeline Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Approval Timeline
        </h2>
        
        {!approvalHistory || !approvalHistory.allApprovalLines || approvalHistory.allApprovalLines.length === 0 ? (
          <p className="text-sm text-gray-600">No approval workflow configured.</p>
        ) : (
          <div className="space-y-4">
            {/* Show all approvals in chronological order */}
            {allApprovals.map((approval) => {
              const statusConfig = getStatusConfig(approval.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={approval.id} className="border border-gray-300 rounded p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${statusConfig.iconColor}`} />
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${statusConfig.badge}`}>
                        {approval.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {format(new Date(approval.createdAt), 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                  
                  {approval.notes && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-700">{approval.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-600">By:</span>
                      <span className="font-medium text-gray-900">{approval.creator.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-600">Dept:</span>
                      <span className="font-medium text-gray-900">{approval.department.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-600">Pos:</span>
                      <span className="font-medium text-gray-900">{approval.jobPosition.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Show current workflow approval lines only if not DONE */}
            {!isDone && approvalHistory.allApprovalLines.map((line) => {
              const approval = allApprovals.find((item) => item.line === line.line);
              const isCompleted = line.status === 'completed';

              // Skip completed lines - they're already shown in approvals above
              if (isCompleted) {
                return null;
              }

              if (line.status === 'current') {
                return (
                  <div key={`line-${line.line}`} className="border border-blue-300 rounded p-4 bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-900">Waiting for Approval</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-700">Dept:</span>
                        <span className="font-medium text-blue-900">{line.department.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-700">Pos:</span>
                        <span className="font-medium text-blue-900">{line.jobPosition.name}</span>
                      </div>
                    </div>
                  </div>
                );
              } else if (line.status === 'pending') {
                return (
                  <div key={`line-${line.line}`} className="border border-gray-300 border-dashed rounded p-4 bg-gray-50 opacity-75">
                    <div className="flex items-center gap-2 mb-2">
                      <Circle className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">Pending</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
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
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
