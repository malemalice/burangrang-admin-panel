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
import type { KpiDataPoint } from '../types/kpi-frequency-rate.types';

const STUDY_COLOR = '#3B82F6';
const WORK_COLOR = '#EF4444';
const TOTAL_COLOR = '#22C55E';

interface TRSRChartProps {
  data: KpiDataPoint[];
}

export function TRSRChart({ data }: TRSRChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">TRSR Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} allowDecimals />
              <Tooltip
                formatter={(value: number) => value.toFixed(2)}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="studyRelated"
                name="SR study related activities"
                stroke={STUDY_COLOR}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="workRelated"
                name="SR work related activities"
                stroke={WORK_COLOR}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total SR"
                stroke={TOTAL_COLOR}
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
