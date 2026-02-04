import {
  BarChart,
  Bar,
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

interface LTICRChartProps {
  data: KpiDataPoint[];
}

export function LTICRChart({ data }: LTICRChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Lost Time Incident Case Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} allowDecimals />
              <Tooltip
                formatter={(value: number) => value.toFixed(2)}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="studyRelated"
                name="LTI CR Study Related Activities"
                fill={STUDY_COLOR}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="workRelated"
                name="LTI CR Work Related Activities"
                fill={WORK_COLOR}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="total"
                name="Total LTI Case Rate"
                fill={TOTAL_COLOR}
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
