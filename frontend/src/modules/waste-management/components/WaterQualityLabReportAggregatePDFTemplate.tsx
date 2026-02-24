import { format } from 'date-fns';
import { WaterQualityParameterCategoryEnum } from '../types/waste-management.types';
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

/**
 * Renders a single table for PDF export: Sample Period, Treatment Plant, Category,
 * then parameter columns grouped by Chemistry / Physics / Microbiology.
 * No regulatory limit rows, no Remark column, no Report Analysis column.
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
    <div
      className="bg-white p-6"
      style={{ width: '210mm', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}
      aria-hidden="true"
    >
      <div className="mb-4 border-b-2 border-gray-800 pb-2">
        <h1 className="text-xl font-bold text-gray-900">
          Water Quality Lab Reports – Aggregated Results
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          Exported on {format(new Date(), 'dd MMM yyyy, HH:mm')}
        </p>
      </div>

      <table
        style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}
        className="text-sm"
      >
        <thead>
          <tr className="bg-gray-100">
            <th
              style={{
                ...thStyle,
                textAlign: 'left',
                width: '12%',
                borderBottom: 'none',
              }}
            >
              {leftColumnLabels[0]}
            </th>
            <th
              style={{
                ...thStyle,
                textAlign: 'left',
                width: '18%',
                borderBottom: 'none',
              }}
            >
              {leftColumnLabels[1]}
            </th>
            <th
              style={{
                ...thStyle,
                textAlign: 'left',
                width: '14%',
                borderBottom: 'none',
              }}
            >
              {leftColumnLabels[2]}
            </th>
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
            <th style={{ ...thStyle, borderTop: 'none', width: '12%' }} />
            <th style={{ ...thStyle, borderTop: 'none', width: '18%' }} />
            <th style={{ ...thStyle, borderTop: 'none', width: '14%' }} />
            {parameterColumns.map((col) => (
              <th
                key={col.id}
                style={{
                  ...thStyle,
                  textAlign: 'center',
                  minWidth: '50px',
                }}
              >
                {col.label}
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
                }}
              >
                {row.samplePeriod}
              </td>
              <td
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                }}
              >
                {row.treatmentPlantName}
              </td>
              <td
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                }}
              >
                {row.categoryLabel}
              </td>
              {parameterColumns.map((col) => (
                <td
                  key={col.id}
                  style={{
                    border: '1px solid #d1d5db',
                    padding: '6px 8px',
                    textAlign: 'center',
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
