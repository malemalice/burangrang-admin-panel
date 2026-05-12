import { format } from 'date-fns';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';
import { InspectionItem, InspectionImageTypeEnum } from '../inspection-items/types/inspection-item.types';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { InspectionRiskRateEnum, INSPECTION_RISK_RATE_OPTIONS } from '@/shared/constants/inspection-risk-rate.enum';
import type { InspectionChecklistDTO } from '@/modules/master-data/types/master-data.types';

interface InspectionItemPDFTemplateProps {
  item: InspectionItem;
  checklistRoots?: InspectionChecklistDTO[];
}

const getStatusLabel = (status?: string) => {
  const map: Record<string, string> = {
    [GeneralStatusEnum.OPEN]: 'Open Issue',
    [GeneralStatusEnum.WAITING_APPROVAL]: 'Waiting Verification',
    [GeneralStatusEnum.CLOSE]: 'Close',
  };
  return map[status || ''] || status || 'N/A';
};

const getStatusTextClass = (status?: string) => {
  if (status === GeneralStatusEnum.CLOSE) return 'text-green-700';
  if (status === GeneralStatusEnum.WAITING_APPROVAL) return 'text-blue-700';
  if (status === GeneralStatusEnum.OPEN) return 'text-blue-700';
  return 'text-gray-700';
};

const getRiskRateLabel = (rate?: string) =>
  INSPECTION_RISK_RATE_OPTIONS.find((o) => o.value === rate)?.label ?? rate ?? '—';

const getRiskRateTextClass = (rate?: string): string => {
  if (rate === InspectionRiskRateEnum.SAFE) return 'text-green-700';
  if (rate === InspectionRiskRateEnum.LOW_HAZARD) return 'text-yellow-700';
  if (rate === InspectionRiskRateEnum.MODERATE_HAZARD) return 'text-orange-600';
  if (rate === InspectionRiskRateEnum.CRITICAL_HAZARD) return 'text-red-700';
  return 'text-gray-600';
};

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs font-semibold text-gray-600 mb-1">{label}</p>
    <p className="text-sm text-gray-900 whitespace-pre-wrap">{value || 'N/A'}</p>
  </div>
);

export const InspectionItemPDFTemplate = ({ item, checklistRoots = [] }: InspectionItemPDFTemplateProps) => {
  const beforeImages = item.images?.filter((img) => img.type === InspectionImageTypeEnum.BEFORE) ?? [];
  const afterImages = item.images?.filter((img) => img.type === InspectionImageTypeEnum.AFTER) ?? [];

  const checklistByCategory = item.checklistResults?.reduce<
    Record<string, NonNullable<typeof item.checklistResults>>
  >((acc, r) => {
    const cat = r.checklistItem?.parent?.name ?? 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(r);
    return acc;
  }, {}) ?? {};

  const totalLeaves = checklistRoots.reduce((sum, root) => sum + (root.children?.length || 0), 0);
  const ratedLeaves = item.checklistResults?.filter((r) => r.riskRate).length ?? 0;
  const computedValue = totalLeaves > 0 ? (ratedLeaves / totalLeaves) * 100 : null;
  const finalValue = item.inspection?.finalInspectionValue ?? computedValue;

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Company header */}
      <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-8">
        <PdfAppHeader />
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            Inspection Finding Monitoring
          </div>
          {item.inspection?.code && (
            <div className="text-xs text-gray-500 mt-0.5">{item.inspection.code}</div>
          )}
          <div className="text-xs text-gray-500 mt-0.5">
            Status:{' '}
            <span className={getStatusTextClass(item.status)}>
              {getStatusLabel(item.status)}
            </span>
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            Exported: {format(new Date(), 'dd MMMM yyyy HH:mm')}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Basic Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Area" value={item.area?.name || item.areaId} />
          <Field label="Type of Hazard" value={item.riskCategory?.name || item.riskCategoryId} />
          <Field label="Risk" value={item.risk?.name || item.riskId} />
          <Field label="Assigned Department" value={item.assignedDepartment?.name || item.assignedDepartmentId} />
          <Field
            label="Assignee"
            value={
              item.assignee
                ? `${item.assignee.firstName} ${item.assignee.lastName}`
                : item.assigneeId
            }
          />
          <Field
            label="Due Date"
            value={item.dueDateAt ? format(new Date(item.dueDateAt), 'dd MMM yyyy HH:mm') : undefined}
          />
          <Field
            label="Created At"
            value={item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy HH:mm') : undefined}
          />
          <Field
            label="Updated At"
            value={item.updatedAt ? format(new Date(item.updatedAt), 'dd MMM yyyy HH:mm') : undefined}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Description
        </h2>
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.description || 'N/A'}</p>
      </div>

      {/* Findings */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Findings
        </h2>
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.findings || 'N/A'}</p>
      </div>

      {/* Follow-up Notes */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Follow-up Notes
        </h2>
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.followUpNotes || 'N/A'}</p>
      </div>

      {/* Checklist Results */}
      {item.checklistResults && item.checklistResults.length > 0 && (
        <div className="mb-8">
          <div className="flex items-end justify-between border-b border-gray-300 pb-2 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Checklist Results</h2>
            {finalValue != null && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Final Inspection Value</p>
                <p className="text-sm font-semibold text-gray-900">
                  {finalValue.toFixed(2)}% ({ratedLeaves}/{totalLeaves})
                </p>
              </div>
            )}
          </div>
          {Object.entries(checklistByCategory).map(([category, results]) => (
            <div key={category} className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{category}</h3>
              <table
                data-pdf-table-splittable
                className="min-w-full border border-gray-300"
                style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
              >
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '50%' }}>
                      Checklist Item
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '20%' }}>
                      Risk Rate
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '30%' }}>
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id}>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                        {result.checklistItem?.name ?? result.checklistItemId}
                      </td>
                      <td className={`border border-gray-300 px-3 py-2 text-xs font-medium break-words ${getRiskRateTextClass(result.riskRate)}`}>
                        {getRiskRateLabel(result.riskRate)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                        {result.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Risk Mitigation */}
      {item.mitigation && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Risk Mitigation
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Elimination Control" value={item.mitigation.eliminationControl} />
            <Field label="Substitution Control" value={item.mitigation.substitutionControl} />
            <Field label="Engineering Control" value={item.mitigation.engineeringControl} />
            <Field label="Administration Control" value={item.mitigation.administrationControl} />
            <Field label="Personal Protective Equipment" value={item.mitigation.personalProtectiveEquipment} />
            <Field label="Transfer" value={item.mitigation.transfer} />
            <Field label="Accept" value={item.mitigation.accept} />
            <Field label="Legal Aspect & Standard Reference" value={item.mitigation.legalAspect} />
          </div>
        </div>
      )}

      {/* Before Images */}
      {beforeImages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Before Images (Current Condition)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {beforeImages.map((image) => (
              <div key={image.id}>
                <img
                  src={image.imageUrl}
                  alt={image.caption || 'Before image'}
                  className="w-full object-cover border border-gray-300"
                  style={{ maxHeight: '160px' }}
                />
                {image.caption && (
                  <p className="text-xs text-gray-600 mt-1">{image.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* After Images */}
      {afterImages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            After Images (After Fix/Action Plan)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {afterImages.map((image) => (
              <div key={image.id}>
                <img
                  src={image.imageUrl}
                  alt={image.caption || 'After image'}
                  className="w-full object-cover border border-gray-300"
                  style={{ maxHeight: '160px' }}
                />
                {image.caption && (
                  <p className="text-xs text-gray-600 mt-1">{image.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
