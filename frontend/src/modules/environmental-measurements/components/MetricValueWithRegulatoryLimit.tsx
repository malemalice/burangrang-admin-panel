import { cn } from '@/core/lib/utils';
import type { RegulatoryMetricKey, RegulatoryLimitMode } from '../utils/regulatoryLimitComparison';
import {
  compareToRegulatoryLimit,
  formatRegulatoryComparisonText,
  getRegulatoryLimitMode,
} from '../utils/regulatoryLimitComparison';

export interface MetricValueWithRegulatoryLimitProps {
  metric: RegulatoryMetricKey;
  value: number | undefined | null;
  limit: number | null | undefined;
  /** Defaults from metric when omitted (matches API mode). */
  mode?: RegulatoryLimitMode;
  align?: 'left' | 'right';
  /** Compact label for PDF / tight layouts */
  compact?: boolean;
}

/**
 * Primary line: measured value. Secondary: regulatory limit. Tertiary: value vs limit (>, =, <) and compliance hint.
 */
export function MetricValueWithRegulatoryLimit({
  metric,
  value,
  limit,
  mode: modeProp,
  align = 'right',
  compact = false,
}: MetricValueWithRegulatoryLimitProps) {
  const mode = modeProp ?? getRegulatoryLimitMode(metric);
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  const limitText = limit != null && Number.isFinite(limit) ? String(limit) : '—';
  const comparison = compareToRegulatoryLimit(value, limit ?? null, mode);
  const comparisonText = formatRegulatoryComparisonText(value, limit ?? null, mode);
  const compliant = comparison.compliant;

  const comparisonColor =
    compliant === null
      ? 'text-gray-500 dark:text-gray-400'
      : compliant
        ? 'text-green-700 dark:text-green-600'
        : 'text-amber-700 dark:text-amber-600';

  return (
    <div className={cn(alignClass)}>
      <div className="font-medium">{value ?? '—'}</div>
      <div
        className={cn(
          'text-gray-500 mt-1 dark:text-gray-400',
          compact ? 'text-[10px] leading-tight' : 'text-xs'
        )}
      >
        Quality Standard Value: {limitText}
      </div>
      {comparisonText && (
        <div
          className={cn(
            'mt-1 font-medium tabular-nums',
            compact ? 'text-[10px] leading-tight' : 'text-xs',
            comparisonColor
          )}
        >
          {comparisonText}
        </div>
      )}
    </div>
  );
}
