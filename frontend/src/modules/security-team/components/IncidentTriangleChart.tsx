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
import type { IncidentSummaryItem } from '../types/security-team.types';

const ACTUAL_COLOR = '#3B82F6';
const DIFFERENCE_COLOR = '#EF4444';

interface IncidentTriangleChartProps {
  data: IncidentSummaryItem[];
}

const TOP_CATEGORY_KEY = 'major incident';

export function IncidentTriangleChart({ data }: IncidentTriangleChartProps) {
  const chartData = data
    .map((d) => ({
      category: d.category,
      count: d.count,
      difference: d.difference <= 0 ? d.difference : -d.count,
    }))
    .sort((a, b) => {
      const aIsTop = a.category.toLowerCase().includes(TOP_CATEGORY_KEY);
      const bIsTop = b.category.toLowerCase().includes(TOP_CATEGORY_KEY);
      if (aIsTop && !bIsTop) return -1;
      if (!aIsTop && bIsTop) return 1;
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
              <XAxis type="number" domain={[-100, 100]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="category" width={70} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [value, '']}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Bar dataKey="difference" name="Difference" fill={DIFFERENCE_COLOR} radius={0} />
              <Bar dataKey="count" name="Count" fill={ACTUAL_COLOR} radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
