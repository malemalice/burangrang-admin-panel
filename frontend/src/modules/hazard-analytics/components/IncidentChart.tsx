import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import type { IncidentSummary } from '../types/hazard-analytics.types';

const ACTUAL_COLOR = '#3B82F6';
const TARGET_COLOR = '#EF4444';

interface IncidentChartProps {
  data: IncidentSummary[];
}

const FATALITY_KEY = 'fatality';

export function IncidentChart({ data }: IncidentChartProps) {
  const chartData = data
    .map((d) => ({
      category: d.category.replace(/\/.*$/, '').replace(/\s*\(.*\)$/, '').trim(),
      actual: d.actual,
      target: d.target <= 0 ? d.target : -d.actual,
    }))
    .sort((a, b) => {
      const aIsFatality = a.category.toLowerCase().includes(FATALITY_KEY);
      const bIsFatality = b.category.toLowerCase().includes(FATALITY_KEY);
      if (aIsFatality && !bIsFatality) return 1;
      if (!aIsFatality && bIsFatality) return -1;
      return 0;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Incident Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 80, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" domain={[-300, 300]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="category" width={70} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [value, '']}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Bar dataKey="target" name="Target / Difference" fill={TARGET_COLOR} radius={0} />
              <Bar dataKey="actual" name="Actual" fill={ACTUAL_COLOR} radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
