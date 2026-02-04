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
import type { IncidentCategoryData } from '../types/incident-profile.types';

const YEAR_2022_2023_COLOR = '#3B82F6';
const YEAR_2023_2024_COLOR = '#EF4444';
const YEAR_2024_2025_COLOR = '#22C55E';

const YEAR_CONFIG = [
  { dataKey: 'year2022_2023' as const, name: 'Year 2022-2023', fill: YEAR_2022_2023_COLOR },
  { dataKey: 'year2023_2024' as const, name: 'Year 2023-2024', fill: YEAR_2023_2024_COLOR },
  { dataKey: 'year2024_2025' as const, name: 'Year 2024-2025', fill: YEAR_2024_2025_COLOR },
];

interface IncidentCountChartProps {
  data: IncidentCategoryData[];
}

export function IncidentCountChart({ data }: IncidentCountChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Minor Incident Profile (Count)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" domain={[0, 30]} tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="category"
                width={180}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: string) =>
                  value.length > 35 ? `${value.slice(0, 35)}...` : value
                }
              />
              <Tooltip
                formatter={(value: number) => [value, '']}
                labelFormatter={(label) => `Category: ${label}`}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend />
              {YEAR_CONFIG.map(({ dataKey, name, fill }) => (
                <Bar key={dataKey} dataKey={dataKey} name={name} stackId="count" fill={fill} radius={0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
