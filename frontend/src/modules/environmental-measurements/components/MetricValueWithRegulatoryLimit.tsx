import { cn } from '@/core/lib/utils';

export interface MetricValueWithRegulatoryLimitProps {
  value: number | undefined | null;
  limit: number | null | undefined;
  align?: 'left' | 'right';
  /** Compact label for PDF / tight layouts */
  compact?: boolean;
}

/**
 * Primary line: measured value. Secondary line: regulatory limit (Room column style).
 */
export function MetricValueWithRegulatoryLimit({
  value,
  limit,
  align = 'right',
  compact = false,
}: MetricValueWithRegulatoryLimitProps) {
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  const limitText = limit != null && Number.isFinite(limit) ? String(limit) : '—';

  return (
    <div className={cn(alignClass)}>
      <div className="font-medium">{value ?? '—'}</div>
      <div
        className={cn(
          'text-gray-500 mt-1 dark:text-gray-400',
          compact ? 'text-[10px] leading-tight' : 'text-xs'
        )}
      >
        Regulatory limit: {limitText}
      </div>
    </div>
  );
}
