import { format } from 'date-fns';
import { Inspection, InspectionItem } from '../types/inspection.types';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

interface InspectionPDFTemplateProps {
  inspection: Inspection;
  items: InspectionItem[];
}

const getInspectionStatusTextClass = (status?: string) => {
  const normalized = (status || '').toUpperCase();
  if (normalized === GeneralStatusEnum.DONE) return 'text-green-700';
  if (normalized === GeneralStatusEnum.REJECTED) return 'text-red-700';
  if (normalized === GeneralStatusEnum.WAITING_APPROVAL) return 'text-blue-700';
  if (normalized === GeneralStatusEnum.OPEN) return 'text-blue-700';
  if (normalized === GeneralStatusEnum.CLOSE) return 'text-green-700';
  if (normalized === GeneralStatusEnum.DRAFT || normalized === GeneralStatusEnum.SCHEDULED) return 'text-gray-700';
  return 'text-yellow-700';
};

const getItemStatusTextClass = (status?: string) => {
  const normalized = (status || '').toUpperCase();
  if (normalized === GeneralStatusEnum.CLOSE) return 'text-green-700';
  if (normalized === GeneralStatusEnum.WAITING_APPROVAL) return 'text-blue-700';
  if (normalized === GeneralStatusEnum.OPEN) return 'text-blue-700';
  return 'text-gray-700';
};

const getStatusLabel = (status?: string) => {
  const map: Record<string, string> = {
    [GeneralStatusEnum.SCHEDULED]: 'Scheduled',
    [GeneralStatusEnum.DRAFT]: 'Draft',
    [GeneralStatusEnum.OPEN]: 'Open',
    [GeneralStatusEnum.WAITING_APPROVAL]: 'Waiting Verification',
    [GeneralStatusEnum.DONE]: 'Done',
    [GeneralStatusEnum.REJECTED]: 'Rejected',
    [GeneralStatusEnum.CLOSE]: 'Close',
  };
  return map[status || ''] || status || 'N/A';
};

export const InspectionPDFTemplate = ({
  inspection,
  items,
}: InspectionPDFTemplateProps) => {
  const areaNames = inspection.areas
    ?.map((a) => a?.name)
    .filter((name): name is string => Boolean(name)) || [];
  const areaDisplay =
    areaNames.length > 0
      ? areaNames.join(', ')
      : inspection.area?.name || 'N/A';

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Inspection Report: {inspection.code}
        </h1>
        <p className="text-sm text-gray-600 mb-2">
          Created on {format(new Date(inspection.createdAt), 'dd MMM yyyy')}
        </p>
        <p className="text-sm font-semibold">
          Status:{' '}
          <span className={getInspectionStatusTextClass(inspection.status)}>
            {getStatusLabel(inspection.status)}
          </span>
        </p>
      </div>

      {/* Inspection Details Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Inspection Details
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Areas</p>
            <p className="text-sm text-gray-900">{areaDisplay}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Inspection Date</p>
            <p className="text-sm text-gray-900">
              {inspection.inspectionDate
                ? format(new Date(inspection.inspectionDate), 'dd MMM yyyy')
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Created By</p>
            <p className="text-sm text-gray-900">
              {inspection.creator
                ? `${inspection.creator.firstName} ${inspection.creator.lastName}`
                : inspection.createdBy || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Created At</p>
            <p className="text-sm text-gray-900">
              {format(new Date(inspection.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Last Updated</p>
            <p className="text-sm text-gray-900">
              {format(new Date(inspection.updatedAt), 'dd MMM yyyy')}
            </p>
          </div>
          {inspection.inspectors && inspection.inspectors.length > 0 && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-gray-600 mb-1">Inspectors</p>
              <p className="text-sm text-gray-900">
                {inspection.inspectors
                  .map((insp) =>
                    insp.inspector
                      ? `${insp.inspector.firstName} ${insp.inspector.lastName}`
                      : ''
                  )
                  .filter(Boolean)
                  .join(', ') || 'N/A'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Items Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 border-b border-gray-300 pb-2">
          Items Summary
        </h2>
        <div className="flex gap-6 text-sm">
          <span>
            <span className="font-semibold text-gray-600">Total:</span>{' '}
            <span className="font-bold text-gray-900">{items.length}</span>
          </span>
          <span>
            <span className="font-semibold text-gray-600">Open:</span>{' '}
            <span className="font-semibold text-blue-700">
              {items.filter((i) => i.status === GeneralStatusEnum.OPEN).length}
            </span>
          </span>
          <span>
            <span className="font-semibold text-gray-600">Close:</span>{' '}
            <span className="font-semibold text-green-700">
              {items.filter((i) => i.status === GeneralStatusEnum.CLOSE).length}
            </span>
          </span>
          <span>
            <span className="font-semibold text-gray-600">Waiting Verification:</span>{' '}
            <span className="font-semibold text-blue-700">
              {items.filter((i) => i.status === GeneralStatusEnum.WAITING_APPROVAL).length}
            </span>
          </span>
        </div>
      </div>

      {/* Inspection Items Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Inspection Items
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-600">No inspection items found.</p>
        ) : (
          <table
            className="min-w-full border border-gray-300"
            style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
          >
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '5%' }}>
                  No
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '12%' }}>
                  Area
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '13%' }}>
                  Type of Hazard
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '13%' }}>
                  Risk
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '12%' }}>
                  Department
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '13%' }}>
                  Assignee
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '10%' }}>
                  Status
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '11%' }}>
                  Due Date
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700" style={{ width: '11%' }}>
                  Created At
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                    {item.area?.name || item.areaId || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                    {item.riskCategory?.name || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                    {item.risk?.name || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                    {item.assignedDepartment?.name || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                    {item.assignee
                      ? `${item.assignee.firstName} ${item.assignee.lastName}`
                      : 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs">
                    <span
                      className={`font-medium ${getItemStatusTextClass(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                    {item.dueDateAt
                      ? format(new Date(item.dueDateAt), 'dd MMM yyyy')
                      : 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                    {item.createdAt
                      ? format(new Date(item.createdAt), 'dd MMM yyyy')
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
