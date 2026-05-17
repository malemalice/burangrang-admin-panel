import { format } from 'date-fns';
import {
  WaterQualityLabReport,
  WaterQualityLabReportResult,
  WaterQualityParameterCategoryEnum,
  WaterQualityLabReportCategoryEnum,
} from '../types/waste-management.types';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';

const WATER_LAB_REPORT_CATEGORY_LABELS: Record<WaterQualityLabReportCategoryEnum, string> = {
  [WaterQualityLabReportCategoryEnum.WASTEWATER]: 'Wastewater',
  [WaterQualityLabReportCategoryEnum.CLEAN_WATER]: 'Clean water',
  [WaterQualityLabReportCategoryEnum.SWIMMING_POOL_WATER]: 'Swimming pool water',
  [WaterQualityLabReportCategoryEnum.DRINKING_WATER]: 'Drinking water',
};

const CATEGORY_LABELS: Record<string, string> = {
  [WaterQualityParameterCategoryEnum.CHEMISTRY]: 'Chemistry',
  [WaterQualityParameterCategoryEnum.PHYSICS]: 'Physics',
  [WaterQualityParameterCategoryEnum.MICROBIOLOGY]: 'Microbiology',
};

function groupResultsByCategory(results: WaterQualityLabReportResult[]) {
  const groups: Record<string, WaterQualityLabReportResult[]> = {};
  for (const r of results) {
    const cat = r.parameter?.category ?? WaterQualityParameterCategoryEnum.CHEMISTRY;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(r);
  }
  return groups;
}

interface WaterQualityLabReportPDFTemplateProps {
  report: WaterQualityLabReport;
}

export function WaterQualityLabReportPDFTemplate({ report }: WaterQualityLabReportPDFTemplateProps) {
  const results = report.labReportResults ?? [];
  const grouped = groupResultsByCategory(results);

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Water Quality Lab Report: {report.reportCode}
            </h1>
            <p className="text-sm text-gray-600 mb-1">
              Report Date: {report.reportDate ? format(new Date(report.reportDate), 'dd MMM yyyy') : '—'}
            </p>
            <p className="text-sm text-gray-600">Generated on {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
          </div>
          <div className="shrink-0">
            <PdfAppHeader />
          </div>
        </div>
      </div>

      {/* General Information */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          General Information
        </h2>
        <table
          data-pdf-table-splittable
          style={{ width: '100%', borderCollapse: 'collapse' }}
          className="text-sm"
        >
          <tbody>
            <tr>
              <td className="py-1 font-semibold text-gray-700 w-1/3">Treatment Plant</td>
              <td className="py-1 text-gray-900 break-words">{report.treatmentPlant?.name || '-'}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700">Category</td>
              <td className="py-1 text-gray-900">
                {report.category ? WATER_LAB_REPORT_CATEGORY_LABELS[report.category] : '-'}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700">Report Date</td>
              <td className="py-1 text-gray-900">
                {report.reportDate ? format(new Date(report.reportDate), 'PPP') : '-'}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700">Prepared By</td>
              <td className="py-1 text-gray-900">
                {report.preparer
                  ? `${report.preparer.firstName} ${report.preparer.lastName}`
                  : '-'}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700">Record created (system)</td>
              <td className="py-1 text-gray-900">
                {report.createdAt ? format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm') : '-'}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700">Submitted By</td>
              <td className="py-1 text-gray-900">
                {report.submitter
                  ? `${report.submitter.firstName} ${report.submitter.lastName}`
                  : '-'}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-gray-700">Submitted At</td>
              <td className="py-1 text-gray-900">
                {report.submittedAt ? format(new Date(report.submittedAt), 'PPP') : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary & Recommendations */}
      <div className="mb-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
            Summary
          </h2>
          <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">
            {report.summary || 'No summary provided.'}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
            Recommendations
          </h2>
          <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">
            {report.recommendations || 'No recommendations provided.'}
          </div>
        </div>
        {report.analystSignature && (
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Analyst Signature:</span> {report.analystSignature}
          </p>
        )}
      </div>

      {/* Results by Category */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Results
        </h2>
        {results.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, rows]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  {CATEGORY_LABELS[category] ?? category}
                </h3>
                <table
                  data-pdf-table-splittable
                  style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}
                  className="text-sm"
                >
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 border border-gray-300 font-semibold">
                        Parameter
                      </th>
                      <th className="text-left p-2 border border-gray-300 font-semibold">Value</th>
                      <th className="text-left p-2 border border-gray-300 font-semibold">Unit</th>
                      <th className="text-left p-2 border border-gray-300 font-semibold">
                        Regulatory Limit
                      </th>
                      <th className="text-left p-2 border border-gray-300 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="p-2 border border-gray-300 font-medium break-words">
                          {r.parameter?.name ?? r.parameterId}
                        </td>
                        <td className="p-2 border border-gray-300 break-words">{r.resultValue}</td>
                        <td className="p-2 border border-gray-300 break-words">
                          {r.unit ?? r.parameter?.unit ?? '-'}
                        </td>
                        <td className="p-2 border border-gray-300">
                          {r.parameter?.regulatoryLimit ?? '-'}
                        </td>
                        <td className="p-2 border border-gray-300 text-gray-600 break-words whitespace-pre-wrap">
                          {r.notes ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 italic">No result values recorded.</p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Printed on: {format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
      </div>
    </div>
  );
}
