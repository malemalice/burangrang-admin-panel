import React from 'react';
import { format } from 'date-fns';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';
import { AuditReport } from '../types/audit-report.types';
import { buildDetailGroups, StatusBadge } from '../utils/audit-report.utils';

interface Props {
  report: AuditReport;
  periodLabel: string;
}

export function AuditReportDetailPDFTemplate({ report, periodLabel }: Props) {
  const groups = buildDetailGroups(report);

  return (
    <div className="bg-white p-6 space-y-5 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-gray-800 pb-3">
        <PdfAppHeader />
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 uppercase tracking-wide">Audit Report</div>
          <div className="text-xs text-gray-500 mt-0.5">Detail View</div>
          <div className="text-xs text-gray-500">{periodLabel}</div>
          <div className="text-[10px] text-gray-400 mt-1">
            Exported: {format(new Date(), 'dd MMMM yyyy HH:mm')}
          </div>
        </div>
      </div>

      {/* Detail table */}
      <table
        data-pdf-table-splittable=""
        className="w-full border-collapse text-[10px]"
        style={{ tableLayout: 'fixed' }}
      >
        <colgroup>
          <col style={{ width: '28px' }} />
          <col />
          <col style={{ width: '72px' }} />
          <col style={{ width: '72px' }} />
          <col style={{ width: '72px' }} />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2} className="text-center text-[10px] px-1 py-1 border bg-gray-50 font-semibold align-middle">
              No.
            </th>
            <th rowSpan={2} className="text-left text-[10px] px-2 py-1 border bg-gray-50 font-semibold align-middle">
              Criteria
            </th>
            <th className="text-center text-[10px] px-1 py-1 border bg-green-50 text-green-800 font-semibold">
              Initial Level
            </th>
            <th className="text-center text-[10px] px-1 py-1 border bg-yellow-50 text-yellow-800 font-semibold">
              Transition Level
            </th>
            <th className="text-center text-[10px] px-1 py-1 border bg-blue-50 text-blue-800 font-semibold">
              Advance Level
            </th>
          </tr>
          <tr>
            <th className="text-center text-[10px] px-1 py-1 border bg-green-50 text-gray-500">Status</th>
            <th className="text-center text-[10px] px-1 py-1 border bg-yellow-50 text-gray-500">Status</th>
            <th className="text-center text-[10px] px-1 py-1 border bg-blue-50 text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group, elementIndex) => {
            if (group.rows.length === 0) return null;
            return (
              <React.Fragment key={group.elementId}>
                {/* Element section header */}
                <tr className="bg-gray-100 border-t border-gray-300">
                  <td className="text-center text-[10px] px-1 py-1 border font-semibold text-gray-700">
                    {elementIndex + 1}
                  </td>
                  <td colSpan={4} className="px-2 py-1.5 border">
                    <span className="font-mono text-[9px] text-gray-400 mr-1.5">{group.elementCode}</span>
                    <span className="text-[10px] font-bold text-gray-900">{group.elementName}</span>
                    {!group.hasAudit && (
                      <span className="ml-2 text-[9px] text-gray-400 italic">No audit this period</span>
                    )}
                  </td>
                </tr>

                {/* Criteria rows */}
                {group.rows.map((row, rowIdx) => (
                  <tr key={row.key} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="text-center text-[10px] px-1 py-1 border text-gray-300" />
                    <td className="px-2 py-1.5 border">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[9px] font-semibold text-gray-900 bg-gray-100 px-1 py-0.5 rounded">
                          {row.criteriaCode}
                        </span>
                        <span className="text-[9px] text-gray-400">{row.clauseCode} · {row.clauseName}</span>
                      </div>
                      <div className="text-[10px] text-gray-800 leading-snug">{row.criteriaName}</div>
                      {row.criteriaDescription && (
                        <div className="text-[9px] text-gray-400 leading-snug mt-0.5 italic">
                          {row.criteriaDescription}
                        </div>
                      )}
                    </td>
                    <td className="text-center px-1 py-1.5 border">
                      <StatusBadge status={row.initial} />
                    </td>
                    <td className="text-center px-1 py-1.5 border">
                      <StatusBadge status={row.transitionLevel} />
                    </td>
                    <td className="text-center px-1 py-1.5 border">
                      <StatusBadge status={row.advanceLevel} />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
