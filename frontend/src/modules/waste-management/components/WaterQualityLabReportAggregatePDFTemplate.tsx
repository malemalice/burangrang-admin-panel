import { format } from 'date-fns';
import type { WaterQualityLabReportAggregateData } from '../utils/water-quality-lab-report-export';

interface WaterQualityLabReportAggregatePDFTemplateProps {
  data: WaterQualityLabReportAggregateData;
}

/**
 * Renders a single table for PDF export: Sample Period, Treatment Plant, Category,
 * then parameter columns grouped by Chemistry / Physics / Microbiology.
 * No regulatory limit rows, no Remark column, no Report Analysis column.
 */
export function WaterQualityLabReportAggregatePDFTemplate({
  data,
}: WaterQualityLabReportAggregatePDFTemplateProps) {
  const { leftColumnLabels, parameterColumns, rows } = data;

  const getParamCellValue = (row: typeof rows[0], paramId: string) => {
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
                border: '1px solid #d1d5db',
                padding: '6px 8px',
                textAlign: 'left',
                fontWeight: 600,
                width: '12%',
              }}
            >
              {leftColumnLabels[0]}
            </th>
            <th
              style={{
                border: '1px solid #d1d5db',
                padding: '6px 8px',
                textAlign: 'left',
                fontWeight: 600,
                width: '18%',
              }}
            >
              {leftColumnLabels[1]}
            </th>
            <th
              style={{
                border: '1px solid #d1d5db',
                padding: '6px 8px',
                textAlign: 'left',
                fontWeight: 600,
                width: '14%',
              }}
            >
              {leftColumnLabels[2]}
            </th>
            {parameterColumns.map((col) => (
              <th
                key={col.id}
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  textAlign: 'center',
                  fontWeight: 600,
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
