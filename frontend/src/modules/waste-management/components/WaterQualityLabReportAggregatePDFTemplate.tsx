import { format } from 'date-fns';
import { WaterQualityParameterCategoryEnum } from '../types/waste-management.types';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';
import type {
  WaterQualityLabReportAggregateData,
  AggregateParameterColumn,
} from '../utils/water-quality-lab-report-export';

const PARAMETER_CATEGORY_ORDER: WaterQualityParameterCategoryEnum[] = [
  WaterQualityParameterCategoryEnum.CHEMISTRY,
  WaterQualityParameterCategoryEnum.PHYSICS,
  WaterQualityParameterCategoryEnum.MICROBIOLOGY,
];

const PARAMETER_CATEGORY_LABELS: Record<string, string> = {
  [WaterQualityParameterCategoryEnum.CHEMISTRY]: 'Chemistry',
  [WaterQualityParameterCategoryEnum.PHYSICS]: 'Physics',
  [WaterQualityParameterCategoryEnum.MICROBIOLOGY]: 'Microbiology',
};

interface WaterQualityLabReportAggregatePDFTemplateProps {
  data: WaterQualityLabReportAggregateData;
}

function groupParameterColumnsByCategory(
  parameterColumns: AggregateParameterColumn[],
): { category: string; label: string; columns: AggregateParameterColumn[] }[] {
  const byCategory: Record<string, AggregateParameterColumn[]> = {};
  for (const col of parameterColumns) {
    if (!byCategory[col.category]) byCategory[col.category] = [];
    byCategory[col.category].push(col);
  }
  return PARAMETER_CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map(
    (category) => ({
      category,
      label: PARAMETER_CATEGORY_LABELS[category] ?? category,
      columns: byCategory[category],
    }),
  );
}

const thStyle = {
  border: '1px solid #d1d5db' as const,
  padding: '6px 8px',
  fontWeight: 600,
  verticalAlign: 'middle' as const,
};

/** Four fixed columns: sample period, plant, category, merged preparer + record meta */
const fixedColWidths = ['10%', '12%', '9%', '17%'] as const;

function formatRegulatoryLimitCell(col: AggregateParameterColumn): string {
  if (col.regulatoryLimit === undefined || col.regulatoryLimit === null) {
    return '—';
  }
  const u = col.unit?.trim();
  return u ? `${col.regulatoryLimit} ${u}` : String(col.regulatoryLimit);
}

/**
 * Renders aggregated PDF: four fixed columns (last merges preparer + record created),
 * parameter headers show name and regulatory limit on separate lines in one cell.
 */
export function WaterQualityLabReportAggregatePDFTemplate({
  data,
}: WaterQualityLabReportAggregatePDFTemplateProps) {
  const { leftColumnLabels, parameterColumns, rows } = data;
  const categoryGroups = groupParameterColumnsByCategory(parameterColumns);

  const getParamCellValue = (row: (typeof rows)[0], paramId: string) => {
    const v = row.parameterValues[paramId];
    return v !== undefined && v !== null ? String(v) : '';
  };

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Water Quality Lab Reports – Aggregated Results
            </h1>
            <p className="text-sm text-gray-600 mb-1">
              Aggregated extract of water quality laboratory test records.
            </p>
            <p className="text-sm text-gray-600">Generated on {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
          </div>
          <div className="shrink-0">
            <PdfAppHeader />
          </div>
        </div>
      </div>

      <table
        data-pdf-table-splittable
        style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}
        className="text-sm"
      >
        <thead>
          <tr className="bg-gray-100">
            {leftColumnLabels.map((label, i) => (
              <th
                key={label}
                style={{
                  ...thStyle,
                  textAlign: 'center',
                  width: fixedColWidths[i],
                  borderBottom: 'none',
                }}
              >
                {label}
              </th>
            ))}
            {categoryGroups.map((group) => (
              <th
                key={group.category}
                colSpan={group.columns.length}
                style={{
                  ...thStyle,
                  textAlign: 'center',
                  minWidth: '50px',
                }}
              >
                {group.label}
              </th>
            ))}
          </tr>
          <tr className="bg-gray-100">
            {fixedColWidths.map((w, i) => (
              <th key={`empty-${i}`} style={{ ...thStyle, borderTop: 'none', width: w }} />
            ))}
            {parameterColumns.map((col) => (
              <th
                key={col.id}
                style={{
                  ...thStyle,
                  textAlign: 'center',
                  minWidth: '50px',
                  fontWeight: 600,
                  verticalAlign: 'middle',
                }}
              >
                <div
                  style={{
                    whiteSpace: 'pre-line',
                    lineHeight: 1.35,
                  }}
                >
                  <span>{col.label}</span>
                  {'\n'}
                  <span style={{ fontWeight: 500, fontSize: '10px', color: '#4b5563' }}>
                    Limit: {formatRegulatoryLimitCell(col)}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
              <td
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                {row.samplePeriod}
              </td>
              <td
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                {row.treatmentPlantName}
              </td>
              <td
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                {row.categoryLabel}
              </td>
              <td
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  verticalAlign: 'top',
                }}
              >
                {row.recordMetaDisplay.split('\n').map((line, lineIdx) => (
                  <div
                    key={lineIdx}
                    style={{
                      fontSize: lineIdx === 0 ? '11px' : '10px',
                      lineHeight: 1.35,
                      color: lineIdx === 0 ? '#111827' : '#4b5563',
                    }}
                  >
                    {line}
                  </div>
                ))}
              </td>
              {parameterColumns.map((col) => (
                <td
                  key={col.id}
                  style={{
                    border: '1px solid #d1d5db',
                    padding: '6px 8px',
                    textAlign: 'center',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {getParamCellValue(row, col.id)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
