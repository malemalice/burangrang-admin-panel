import { format } from 'date-fns';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';
import { AuditReport, AuditReportCriteriaGroup } from '../types/audit-report.types';
import { compliancePercent } from '../utils/audit-report.utils';

interface Props {
  report: AuditReport;
  periodLabel: string;
}

const LevelHeader = ({
  label,
  bgClass,
  textClass,
}: {
  label: string;
  bgClass: string;
  textClass: string;
}) => (
  <th colSpan={4} className={`text-center text-[10px] font-semibold px-2 py-1 border ${bgClass} ${textClass}`}>
    {label}
  </th>
);

const SubHeaders = ({ bgClass }: { bgClass: string }) => (
  <>
    <th className={`text-center text-[10px] px-1 py-1 border ${bgClass} text-green-700`}>Comply</th>
    <th className={`text-center text-[10px] px-1 py-1 border ${bgClass} text-yellow-700`}>Minor</th>
    <th className={`text-center text-[10px] px-1 py-1 border ${bgClass} text-red-700`}>Major</th>
    <th className={`text-center text-[10px] px-1 py-1 border ${bgClass} text-gray-500`}>Total</th>
  </>
);

const GroupDataCells = ({ group }: { group: AuditReportCriteriaGroup }) => (
  <>
    <td className="text-center text-[10px] px-1 py-1 border text-green-800 font-medium">{group.comply || '—'}</td>
    <td className="text-center text-[10px] px-1 py-1 border text-yellow-800 font-medium">{group.notComplyMinor || '—'}</td>
    <td className="text-center text-[10px] px-1 py-1 border text-red-800 font-medium">{group.notComplyMajor || '—'}</td>
    <td className="text-center text-[10px] px-1 py-1 border text-gray-500">{group.total}</td>
  </>
);

const SummaryBox = ({
  title,
  group,
  borderColor,
}: {
  title: string;
  group: AuditReportCriteriaGroup;
  borderColor: string;
}) => {
  const pct = compliancePercent(group);
  const assessed = group.total - group.notAssessed;
  return (
    <div className={`border-l-4 ${borderColor} pl-3 py-2`}>
      <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{title}</div>
      <div className="text-2xl font-bold text-gray-900 mt-0.5">{pct}%</div>
      <div className="text-[10px] text-gray-500 mt-0.5">
        {group.comply} comply / {assessed} assessed / {group.total} total
      </div>
      <div className="flex gap-3 mt-1 text-[10px]">
        <span className="text-yellow-700">{group.notComplyMinor} minor</span>
        <span className="text-red-700">{group.notComplyMajor} major</span>
        <span className="text-gray-400">{group.notAssessed} not assessed</span>
      </div>
    </div>
  );
};

export function AuditReportSummaryPDFTemplate({ report, periodLabel }: Props) {
  return (
    <div className="bg-white p-6 space-y-5 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-gray-800 pb-3">
        <PdfAppHeader />
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 uppercase tracking-wide">Audit Report</div>
          <div className="text-xs text-gray-500 mt-0.5">Summary View</div>
          <div className="text-xs text-gray-500">{periodLabel}</div>
          <div className="text-[10px] text-gray-400 mt-1">
            Exported: {format(new Date(), 'dd MMMM yyyy HH:mm')}
          </div>
        </div>
      </div>

      {/* Summary boxes */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryBox title="Initial Level" group={report.summary.initial} borderColor="border-green-500" />
        <SummaryBox title="Transition Level" group={report.summary.transitionLevel} borderColor="border-yellow-500" />
        <SummaryBox title="Advance Level" group={report.summary.advanceLevel} borderColor="border-blue-500" />
      </div>

      {/* Matrix table */}
      <table
        data-pdf-table-splittable=""
        className="w-full border-collapse text-[10px]"
        style={{ tableLayout: 'fixed' }}
      >
        <colgroup>
          <col style={{ width: '28px' }} />
          <col style={{ width: '160px' }} />
          {/* Initial: 4 cols */}
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
          {/* Transition: 4 cols */}
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
          {/* Advance: 4 cols */}
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2} className="text-center text-[10px] px-1 py-1 border bg-gray-50 font-semibold align-middle">
              No.
            </th>
            <th rowSpan={2} className="text-left text-[10px] px-2 py-1 border bg-gray-50 font-semibold align-middle">
              Element
            </th>
            <LevelHeader label="Initial Level (Tingkatan Awal)" bgClass="bg-green-50" textClass="text-green-800" />
            <LevelHeader label="Transition Level (Tingkatan Transisi)" bgClass="bg-yellow-50" textClass="text-yellow-800" />
            <LevelHeader label="Advance Level (Tingkatan Lanjutan)" bgClass="bg-blue-50" textClass="text-blue-800" />
          </tr>
          <tr>
            <SubHeaders bgClass="bg-green-50" />
            <SubHeaders bgClass="bg-yellow-50" />
            <SubHeaders bgClass="bg-blue-50" />
          </tr>
        </thead>
        <tbody>
          {report.elements.map((el, idx) => (
            <tr key={el.elementId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="text-center text-[10px] px-1 py-1 border font-medium">{idx + 1}</td>
              <td className="text-[10px] px-2 py-1 border">
                <span className="font-mono text-[9px] text-gray-400 mr-1">{el.elementCode}</span>
                <span className="font-medium text-gray-900">{el.elementName}</span>
                {!el.hasAudit && (
                  <span className="block text-[9px] text-gray-400 italic">No audit this period</span>
                )}
              </td>
              <GroupDataCells group={el.initial} />
              <GroupDataCells group={el.transitionLevel} />
              <GroupDataCells group={el.advanceLevel} />
            </tr>
          ))}

          {/* Totals row */}
          <tr className="bg-gray-100 border-t-2 border-gray-400 font-semibold">
            <td className="text-center text-[10px] px-1 py-1 border" />
            <td className="text-[10px] px-2 py-1 border font-bold text-gray-800">Total</td>
            <td className="text-center text-[10px] px-1 py-1 border text-green-800">{report.summary.initial.comply}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-yellow-800">{report.summary.initial.notComplyMinor}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-red-800">{report.summary.initial.notComplyMajor}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-gray-500">{report.summary.initial.total}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-green-800">{report.summary.transitionLevel.comply}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-yellow-800">{report.summary.transitionLevel.notComplyMinor}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-red-800">{report.summary.transitionLevel.notComplyMajor}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-gray-500">{report.summary.transitionLevel.total}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-green-800">{report.summary.advanceLevel.comply}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-yellow-800">{report.summary.advanceLevel.notComplyMinor}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-red-800">{report.summary.advanceLevel.notComplyMajor}</td>
            <td className="text-center text-[10px] px-1 py-1 border text-gray-500">{report.summary.advanceLevel.total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
