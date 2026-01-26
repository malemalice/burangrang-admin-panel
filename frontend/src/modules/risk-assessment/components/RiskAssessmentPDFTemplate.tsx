import { format } from 'date-fns';
import { RiskAssessment, RiskAssessmentItem } from '@/core/lib/types';
import { ApprovalStatusHistory } from '@/modules/master-data';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

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
  const getStatusTextClass = (status?: string) => {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'APPROVED') return 'text-green-700';
    if (normalized === 'REJECTED') return 'text-red-700';
    if (normalized.includes('WAIT')) return 'text-blue-700';
    if (normalized === 'PENDING') return 'text-gray-700';
    return 'text-yellow-700';
  };

  // Get all approvals sorted by createdAt (chronological order)
  const allApprovals = approvalHistory?.history?.slice().sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  ) || [];

  const approvalLines = approvalHistory?.allApprovalLines || [];

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
                      <span className={`font-medium ${
                        item.interpretation === 'LOW' ? 'text-green-700' :
                        item.interpretation === 'MEDIUM' ? 'text-yellow-700' :
                        item.interpretation === 'HIGH' ? 'text-orange-700' :
                        item.interpretation === 'CRITICAL' ? 'text-red-700' :
                        item.interpretation === 'EXTREME' ? 'text-purple-700' :
                        'text-gray-700'
                      }`}>
                        {item.interpretation}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {item.postRiskMatrixRating || 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">
                      {item.postInterpretation ? (
                        <span className={`font-medium ${
                          item.postInterpretation === 'LOW' ? 'text-green-700' :
                          item.postInterpretation === 'MEDIUM' ? 'text-yellow-700' :
                          item.postInterpretation === 'HIGH' ? 'text-orange-700' :
                          item.postInterpretation === 'CRITICAL' ? 'text-red-700' :
                          item.postInterpretation === 'EXTREME' ? 'text-purple-700' :
                          'text-gray-700'
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

        {/* Summary row */}
        <div className="mb-3 text-sm text-gray-800">
          <span className="font-semibold">Current Status:</span>{' '}
          <span className="font-medium">{approvalHistory?.currentStatus || 'N/A'}</span>
          {!isDone && approvalHistory?.nextApprover && (
            <>
              <span className="mx-2 text-gray-400">|</span>
              <span className="font-semibold">Next:</span>{' '}
              <span className="font-medium">
                {approvalHistory.nextApprover.department.name} / {approvalHistory.nextApprover.jobPosition.name}
              </span>
            </>
          )}
        </div>

        {/* Workflow table (preferred when configured) */}
        {approvalLines.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-2">Workflow</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Step</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Department</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Position</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">By</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalLines.map((line) => {
                    const approvalsForLine = allApprovals.filter((a) => a.line === line.line);
                    const lastApproval = approvalsForLine.length > 0 ? approvalsForLine[approvalsForLine.length - 1] : null;

                    const statusLabel =
                      line.status === 'completed'
                        ? (lastApproval?.status || 'COMPLETED')
                        : line.status === 'current'
                          ? 'WAITING APPROVAL'
                          : 'PENDING';

                    return (
                      <tr key={`wf-${line.line}`}>
                        <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{line.line}</td>
                        <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{line.department.name}</td>
                        <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{line.jobPosition.name}</td>
                        <td className="border border-gray-300 px-3 py-2 text-xs">
                          <span className={`font-semibold ${getStatusTextClass(statusLabel)}`}>{statusLabel}</span>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{lastApproval?.creator?.name || '-'}</td>
                        <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                          {lastApproval?.createdAt ? format(new Date(lastApproval.createdAt), 'dd MMM yyyy HH:mm') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approval history table (always show if we have data) */}
        {allApprovals.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Approval History</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Line</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">By</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Department</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Position</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {allApprovals.map((approval, idx) => (
                    <tr key={`ah-${approval.id}`}>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{idx + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 text-xs">
                        <span className={`font-semibold ${getStatusTextClass(approval.status)}`}>{approval.status}</span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{approval.line}</td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{approval.creator?.name || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{approval.department?.name || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{approval.jobPosition?.name || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                        {approval.createdAt ? format(new Date(approval.createdAt), 'dd MMM yyyy HH:mm') : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                        {approval.notes || '-'}
                        {approval.isHistorical ? ' (Historical)' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : approvalLines.length === 0 ? (
          <p className="text-sm text-gray-900">No approval information available.</p>
        ) : null}
      </div>
    </div>
  );
};
