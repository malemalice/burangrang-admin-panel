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
import type { NonConformanceCriteria } from '../types/hazard-analytics.types';

const BAR_COLOR = '#3B82F6';

interface NonConformanceCriteriaChartProps {
  data: NonConformanceCriteria[];
}

export function NonConformanceCriteriaChart({ data }: NonConformanceCriteriaChartProps) {
  const chartData = [...data].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Non Conformance Criteria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 140, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="criteria" width={135} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => [value, 'Count']} />
              <Bar dataKey="count" name="Count" fill={BAR_COLOR} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
