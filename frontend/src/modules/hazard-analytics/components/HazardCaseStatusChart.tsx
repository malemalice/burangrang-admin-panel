import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import type { HazardStatus } from '../types/hazard-analytics.types';

const OPEN_COLOR = '#EF4444';
const CLOSED_COLOR = '#22C55E';

interface HazardCaseStatusChartProps {
  data: HazardStatus;
  periodLabel?: string;
}

export function HazardCaseStatusChart({ data, periodLabel }: HazardCaseStatusChartProps) {
  const total = data.total || 1;
  const closedPct = ((data.closed / total) * 100).toFixed(1);
  const openPct = ((data.open / total) * 100).toFixed(1);
  const pieData = [
    { name: 'Closed', value: data.closed, color: CLOSED_COLOR, percentage: closedPct },
    { name: 'Open', value: data.open, color: OPEN_COLOR, percentage: openPct },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Hazard Case Status{periodLabel ? ` ${periodLabel}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percentage }: { name: string; percentage: string }) => `${name} ${percentage}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: { payload: { percentage: string } }) => [
                  `${value} (${props.payload.percentage}%)`,
                  name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
