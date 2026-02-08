import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import type { NonConformanceCriteria } from '../types/hazard-analytics.types';

const BAR_COLOR = '#3B82F6';
const MAX_CRITERIA_LABEL_LENGTH = 42;
const TOP_N = 15;
const BAR_HEIGHT_PX = 28;
const CHART_MIN_HEIGHT = 280;
const CHART_MAX_HEIGHT = 520;

function truncateLabel(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trim()}\u2026`;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const count = payload[0]?.value ?? 0;
  const fullCriteria = label ?? '';
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-foreground break-words max-w-[320px]">{fullCriteria}</p>
      <p className="mt-1 text-muted-foreground">Count: {count}</p>
    </div>
  );
}

interface NonConformanceCriteriaChartProps {
  data: NonConformanceCriteria[];
}

export function NonConformanceCriteriaChart({ data }: NonConformanceCriteriaChartProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const chartData = sorted.slice(0, TOP_N);
  const chartHeight = Math.min(
    CHART_MAX_HEIGHT,
    Math.max(CHART_MIN_HEIGHT, chartData.length * BAR_HEIGHT_PX),
  );
  const hasMore = sorted.length > TOP_N;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Non Conformance Criteria</CardTitle>
        {hasMore && (
          <p className="text-xs text-muted-foreground">
            Showing top {TOP_N} by count ({sorted.length} total)
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto" style={{ minHeight: chartHeight }}>
          <div style={{ height: chartHeight, minWidth: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 12, right: 24, left: 8, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="criteria"
                  width={240}
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                  tickFormatter={(value) => truncateLabel(String(value), MAX_CRITERIA_LABEL_LENGTH)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }} />
                <Bar dataKey="count" name="Count" fill={BAR_COLOR} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
