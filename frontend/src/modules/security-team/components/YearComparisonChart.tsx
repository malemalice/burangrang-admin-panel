import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import type { SifrComparisonRow } from '../types/security-team.types';

const YEAR_2023_2024_COLOR = '#3B82F6';
const YEAR_2024_2025_COLOR = '#EF4444';

interface YearComparisonChartProps {
  data: SifrComparisonRow[];
}

export function YearComparisonChart({ data }: YearComparisonChartProps) {
  const chartData = [
    {
      metric: 'Total Security Incident Frequency Rate',
      '2023-2024': data.find((r) => r.year === '2023-2024')?.totalSifr ?? 0,
      '2024-2025': data.find((r) => r.year === '2024-2025')?.totalSifr ?? 0,
    },
    {
      metric: 'Total Major Incident rate',
      '2023-2024': data.find((r) => r.year === '2023-2024')?.majorRate ?? 0,
      '2024-2025': data.find((r) => r.year === '2024-2025')?.majorRate ?? 0,
    },
    {
      metric: 'Total Moderate Incident rate',
      '2023-2024': data.find((r) => r.year === '2023-2024')?.moderateRate ?? 0,
      '2024-2025': data.find((r) => r.year === '2024-2025')?.moderateRate ?? 0,
    },
    {
      metric: 'Total Minor Incident rate',
      '2023-2024': data.find((r) => r.year === '2023-2024')?.minorRate ?? 0,
      '2024-2025': data.find((r) => r.year === '2024-2025')?.minorRate ?? 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">2023-2024 vs 2024-2025</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 2.5]} tick={{ fontSize: 12 }} allowDecimals />
              <Tooltip
                formatter={(value: number) => value.toFixed(2)}
                labelFormatter={(label) => `Metric: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="2023-2024"
                name="2023-2024"
                stroke={YEAR_2023_2024_COLOR}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="2024-2025"
                name="2024-2025"
                stroke={YEAR_2024_2025_COLOR}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
