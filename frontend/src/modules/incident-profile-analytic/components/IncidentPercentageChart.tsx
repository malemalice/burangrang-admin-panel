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

const FISCAL_YEAR_COLOR_PALETTE = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6B7280'];

function fiscalYearKeyToLabel(key: string): string {
  const match = key.match(/^year(\d+)_(\d+)$/);
  return match ? `${match[1]}-${match[2]}` : key;
}

function buildYearConfig(yearsToShow: string[]) {
  return yearsToShow.map((dataKey, i) => ({
    dataKey,
    name: fiscalYearKeyToLabel(dataKey),
    fill: FISCAL_YEAR_COLOR_PALETTE[i % FISCAL_YEAR_COLOR_PALETTE.length],
  }));
}

interface IncidentPercentageChartProps {
  data: IncidentCategoryData[];
  yearsToShow: string[];
}

export function IncidentPercentageChart({ data, yearsToShow }: IncidentPercentageChartProps) {
  const yearConfig = buildYearConfig(yearsToShow);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Minor Incident Profile (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Minor Incident Profile (%)</CardTitle>
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
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
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
                formatter={(value: number) => [`${value}%`, '']}
                labelFormatter={(label) => `Category: ${label}`}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend />
              {yearConfig.map(({ dataKey, name, fill }) => (
                <Bar key={dataKey} dataKey={dataKey} name={name} stackId="pct" fill={fill} radius={0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
