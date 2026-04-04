import { format } from 'date-fns';
import {
  WaterQualityLabReport,
  WaterQualityLabReportCategoryEnum,
  WaterQualityParameterCategoryEnum,
} from '../types/waste-management.types';

const PARAMETER_CATEGORY_ORDER: WaterQualityParameterCategoryEnum[] = [
  WaterQualityParameterCategoryEnum.CHEMISTRY,
  WaterQualityParameterCategoryEnum.PHYSICS,
  WaterQualityParameterCategoryEnum.MICROBIOLOGY,
];

export interface AggregateParameterColumn {
  id: string;
  label: string;
  category: string;
  regulatoryLimit?: number;
  unit?: string;
}

export interface AggregateRow {
  samplePeriod: string;
  treatmentPlantName: string;
  categoryLabel: string;
  /** Prepared by and record created (system), newline-separated for PDF/table display */
  recordMetaDisplay: string;
  parameterValues: Record<string, string | number>;
}

export interface WaterQualityLabReportAggregateData {
  leftColumnLabels: readonly [string, string, string, string];
  parameterColumns: AggregateParameterColumn[];
  rows: AggregateRow[];
}

function getParameterCategory(
  category: string | undefined,
): WaterQualityParameterCategoryEnum {
  if (
    category === WaterQualityParameterCategoryEnum.CHEMISTRY ||
    category === WaterQualityParameterCategoryEnum.PHYSICS ||
    category === WaterQualityParameterCategoryEnum.MICROBIOLOGY
  ) {
    return category;
  }
  return WaterQualityParameterCategoryEnum.CHEMISTRY;
}

function formatPreparerName(report: WaterQualityLabReport): string {
  if (report.preparer) {
    return `${report.preparer.firstName} ${report.preparer.lastName}`.trim();
  }
  return '—';
}

function formatRecordCreatedAt(report: WaterQualityLabReport): string {
  if (!report.createdAt) return '—';
  try {
    return format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm');
  } catch {
    return '—';
  }
}

/**
 * Build aggregated columns and rows from reports for the single-file PDF table.
 * One row per report; parameter columns grouped by Chemistry, Physics, Microbiology.
 */
export function buildWaterQualityLabReportAggregate(
  reports: WaterQualityLabReport[],
  reportCategoryLabels: Record<WaterQualityLabReportCategoryEnum, string>,
): WaterQualityLabReportAggregateData {
  const leftColumnLabels: [string, string, string, string] = [
    'Sample Period',
    'Treatment Plant',
    'Category',
    'Prepared by / Record created',
  ];

  const parameterMap = new Map<
    string,
    {
      id: string;
      label: string;
      category: WaterQualityParameterCategoryEnum;
      regulatoryLimit?: number;
      unit?: string;
    }
  >();
  for (const report of reports) {
    const results = report.labReportResults ?? [];
    for (const r of results) {
      if (r.parameter && !parameterMap.has(r.parameter.id)) {
        const lim = r.parameter.regulatoryLimit;
        parameterMap.set(r.parameter.id, {
          id: r.parameter.id,
          label: r.parameter.name ?? r.parameter.code ?? r.parameter.id,
          category: getParameterCategory(r.parameter.category),
          regulatoryLimit: lim !== undefined && lim !== null ? Number(lim) : undefined,
          unit: r.parameter.unit,
        });
      }
    }
  }

  const byCategory: Record<
    WaterQualityParameterCategoryEnum,
    { id: string; label: string }[]
  > = {
    [WaterQualityParameterCategoryEnum.CHEMISTRY]: [],
    [WaterQualityParameterCategoryEnum.PHYSICS]: [],
    [WaterQualityParameterCategoryEnum.MICROBIOLOGY]: [],
  };
  for (const [, p] of parameterMap) {
    byCategory[p.category].push({ id: p.id, label: p.label });
  }
  for (const cat of Object.keys(byCategory) as WaterQualityParameterCategoryEnum[]) {
    byCategory[cat].sort((a, b) => a.label.localeCompare(b.label));
  }

  const parameterColumns: AggregateParameterColumn[] = [];
  for (const cat of PARAMETER_CATEGORY_ORDER) {
    for (const p of byCategory[cat]) {
      const full = parameterMap.get(p.id)!;
      parameterColumns.push({
        id: full.id,
        label: full.label,
        category: cat,
        regulatoryLimit: full.regulatoryLimit,
        unit: full.unit,
      });
    }
  }

  const rows: AggregateRow[] = reports.map((report) => {
    const results = report.labReportResults ?? [];
    const valueByParamId: Record<string, string | number> = {};
    for (const r of results) {
      const paramId = r.parameterId;
      valueByParamId[paramId] = r.resultValue;
    }
    return {
      samplePeriod: report.reportDate
        ? format(new Date(report.reportDate), 'MMMM yyyy')
        : '-',
      treatmentPlantName: report.treatmentPlant?.name ?? '-',
      categoryLabel:
        report.category && reportCategoryLabels[report.category]
          ? reportCategoryLabels[report.category]
          : '-',
      recordMetaDisplay: `${formatPreparerName(report)}\n${formatRecordCreatedAt(report)}`,
      parameterValues: valueByParamId,
    };
  });

  return {
    leftColumnLabels,
    parameterColumns,
    rows,
  };
}
