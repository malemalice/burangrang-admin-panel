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
import type { TypeNonConformanceItem } from '../types/security-team.types';

const BAR_COLOR = '#3B82F6';

interface TypeNonConformanceChartProps {
  data: TypeNonConformanceItem[];
  periodLabel?: string;
}

export function TypeNonConformanceChart({ data, periodLabel }: TypeNonConformanceChartProps) {
  const chartData = [...data].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Type Non Conformance{periodLabel ? ` ${periodLabel}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 90, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="type" width={85} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => [value, 'Count']} />
              <Bar dataKey="count" name="Count" fill={BAR_COLOR} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
