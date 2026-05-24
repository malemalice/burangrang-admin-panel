import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import type {
  WaterQualityDashboardData,
  WaterQualityDashboardPlant,
} from '../types/water-quality-dashboard.types';

const PLANT_COLORS = [
  '#3B82F6',
  '#22C55E',
  '#EF4444',
  '#F59E0B',
  '#8B5CF6',
  '#0EA5E9',
  '#EC4899',
  '#14B8A6',
];

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

interface WaterQualityChartProps {
  data: WaterQualityDashboardData;
}

interface ChartRow {
  monthLabel: string;
  monthIndex: number;
  trendline?: number;
  [plantId: string]: number | string | null | undefined;
}

export function WaterQualityChart({ data }: WaterQualityChartProps) {
  const { parameter, plants, months, averageValue, trendline } = data;

  const chartData = useMemo<ChartRow[]>(() => {
    return months.map((entry, idx) => {
      const row: ChartRow = {
        monthLabel: MONTH_LABELS[idx] ?? `M${entry.month}`,
        monthIndex: idx,
      };
      for (const plant of plants) {
        row[plant.id] = entry.values[plant.id] ?? null;
      }
      if (trendline) {
        row.trendline = trendline.slope * idx + trendline.intercept;
      }
      return row;
    });
  }, [months, plants, trendline]);

  const hasAnyValue = useMemo(() => {
    return chartData.some((row) =>
      plants.some((p) => typeof row[p.id] === 'number'),
    );
  }, [chartData, plants]);

  if (!parameter) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Recap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            No parameter selected. Submit at least one DONE lab report with results to populate this dashboard.
          </div>
        </CardContent>
      </Card>
    );
  }

  const unit = parameter.unit;
  const tooltipFormatter = (value: unknown, name: string) => {
    if (typeof value !== 'number') return ['-', name];
    return [`${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${unit}`, name];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {parameter.name}
          <span className="ml-2 text-sm font-normal text-muted-foreground">({unit})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAnyValue ? (
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: unit,
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12, fill: 'currentColor' },
                  }}
                />
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
                {plants.map((plant: WaterQualityDashboardPlant, idx) => (
                  <Bar
                    key={plant.id}
                    dataKey={plant.id}
                    name={plant.name}
                    fill={PLANT_COLORS[idx % PLANT_COLORS.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
                {averageValue !== null && (
                  <ReferenceLine
                    y={averageValue}
                    stroke="#EF4444"
                    strokeWidth={2}
                    label={{
                      value: `Average ${averageValue.toFixed(2)}`,
                      position: 'insideTopRight',
                      fontSize: 11,
                      fill: '#EF4444',
                    }}
                  />
                )}
                {parameter.regulatoryLimit !== null && (
                  <ReferenceLine
                    y={parameter.regulatoryLimit}
                    stroke="#F59E0B"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `Regulatory Limit ${parameter.regulatoryLimit}`,
                      position: 'insideBottomRight',
                      fontSize: 11,
                      fill: '#F59E0B',
                    }}
                  />
                )}
                {trendline && (
                  <Line
                    type="linear"
                    dataKey="trendline"
                    name="Trendline"
                    stroke="#0EA5E9"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            No results found for this parameter in the selected period.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WaterQualityChart;
