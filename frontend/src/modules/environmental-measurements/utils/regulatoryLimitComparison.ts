/**
 * Regulatory limit semantics: single stored number per metric is either a minimum floor or maximum ceiling.
 * Must stay aligned with backend environmental-measurements regulatory-limits response modes.
 */
export type RegulatoryMetricKey = 'lighting' | 'noise' | 'humidity' | 'temperature';

export type RegulatoryLimitMode = 'min' | 'max';

const MODE_BY_METRIC: Record<RegulatoryMetricKey, RegulatoryLimitMode> = {
  lighting: 'min',
  noise: 'max',
  humidity: 'max',
  temperature: 'max',
};

export const REGULATORY_LIMIT_EPSILON = 1e-6;

export function getRegulatoryLimitMode(metric: RegulatoryMetricKey): RegulatoryLimitMode {
  return MODE_BY_METRIC[metric];
}

export interface RegulatoryComparisonResult {
  /** Relational operator between measured value and limit */
  symbol: '>' | '<' | '=';
  /** null if value or limit is missing / non-finite */
  compliant: boolean | null;
}

export function compareToRegulatoryLimit(
  value: number | null | undefined,
  limit: number | null | undefined,
  mode: RegulatoryLimitMode,
): RegulatoryComparisonResult {
  if (value == null || !Number.isFinite(value) || limit == null || !Number.isFinite(limit)) {
    return { symbol: '=', compliant: null };
  }

  const diff = value - limit;
  if (Math.abs(diff) < REGULATORY_LIMIT_EPSILON) {
    return { symbol: '=', compliant: true };
  }
  if (diff > REGULATORY_LIMIT_EPSILON) {
    return { symbol: '>', compliant: mode === 'min' };
  }
  return { symbol: '<', compliant: mode === 'max' };
}

/** e.g. "250 < 300" — omit when comparison not applicable */
export function formatRegulatoryComparisonText(
  value: number | null | undefined,
  limit: number | null | undefined,
  mode: RegulatoryLimitMode,
): string | null {
  if (value == null || !Number.isFinite(value) || limit == null || !Number.isFinite(limit)) {
    return null;
  }
  const { symbol } = compareToRegulatoryLimit(value, limit, mode);
  return `${value} ${symbol} ${limit}`;
}
