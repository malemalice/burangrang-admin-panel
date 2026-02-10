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

const YEAR_COLOR_MAP: Record<string, string> = {
  year2022_2023: '#3B82F6',
  year2023_2024: '#EF4444',
  year2024_2025: '#22C55E',
};

const YEAR_LABEL_MAP: Record<string, string> = {
  year2022_2023: 'Year 2022-2023',
  year2023_2024: 'Year 2023-2024',
  year2024_2025: 'Year 2024-2025',
};

function buildYearConfig(yearsToShow: string[]) {
  return yearsToShow.map((dataKey) => ({
    dataKey,
    name: YEAR_LABEL_MAP[dataKey] ?? dataKey,
    fill: YEAR_COLOR_MAP[dataKey] ?? '#6B7280',
  }));
}

interface IncidentCountChartProps {
  data: IncidentCategoryData[];
  yearsToShow: string[];
}

export function IncidentCountChart({ data, yearsToShow }: IncidentCountChartProps) {
  const yearConfig = buildYearConfig(yearsToShow);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Minor Incident Profile (Count)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(
    ...data.flatMap((row) => [
      row.year2022_2023,
      row.year2023_2024,
      row.year2024_2025,
    ]),
    1,
  );
  const domainMax = Math.min(Math.ceil(maxCount * 1.2), 100);

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
              <XAxis type="number" domain={[0, domainMax]} tick={{ fontSize: 12 }} />
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
              {yearConfig.map(({ dataKey, name, fill }) => (
                <Bar key={dataKey} dataKey={dataKey} name={name} stackId="count" fill={fill} radius={0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
