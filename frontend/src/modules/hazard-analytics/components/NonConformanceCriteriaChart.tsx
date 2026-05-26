import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import type { NonConformanceCriteria } from '../types/hazard-analytics.types';

const BAR_COLOR = '#3B82F6';
const MAX_CRITERIA_LABEL_LENGTH = 42;
const TOP_N = 15;
const BAR_HEIGHT_PX = 28;
const CHART_MIN_HEIGHT = 280;
const CHART_MAX_HEIGHT = 520;
const TOOLTIP_WIDTH = 340;

function truncateLabel(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trim()}…`;
}

interface HoveredBar {
  criteria: string;
  count: number;
}

function PortalTooltip({
  hovered,
  mousePos,
}: {
  hovered: HoveredBar | null;
  mousePos: { x: number; y: number };
}) {
  if (!hovered) return null;

  const left =
    mousePos.x + 16 + TOOLTIP_WIDTH > window.innerWidth
      ? mousePos.x - TOOLTIP_WIDTH - 16
      : mousePos.x + 16;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left,
        top: mousePos.y - 10,
        zIndex: 9999,
        pointerEvents: 'none',
        width: TOOLTIP_WIDTH,
      }}
      className="rounded-md border bg-background px-3 py-2 text-sm shadow-md"
    >
      <p className="font-medium text-foreground break-words">{hovered.criteria}</p>
      <p className="mt-1 text-muted-foreground">Count: {hovered.count}</p>
    </div>,
    document.body,
  );
}

interface NonConformanceCriteriaChartProps {
  data: NonConformanceCriteria[];
}

export function NonConformanceCriteriaChart({ data }: NonConformanceCriteriaChartProps) {
  const [hoveredBar, setHoveredBar] = useState<HoveredBar | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const sorted = [...data].sort((a, b) => b.count - a.count);
  const chartData = sorted.slice(0, TOP_N);
  const chartHeight = Math.min(
    CHART_MAX_HEIGHT,
    Math.max(CHART_MIN_HEIGHT, chartData.length * BAR_HEIGHT_PX),
  );
  const hasMore = sorted.length > TOP_N;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Non Conformance Criteria</CardTitle>
        {hasMore && (
          <p className="text-xs text-muted-foreground">
            Showing top {TOP_N} by count ({sorted.length} total)
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          style={{ height: chartHeight, minWidth: 400 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredBar(null)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 12, right: 24, left: 8, bottom: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="criteria"
                width={240}
                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                tickFormatter={(value) => truncateLabel(String(value), MAX_CRITERIA_LABEL_LENGTH)}
                tickLine={false}
                axisLine={false}
              />
              <Bar
                dataKey="count"
                name="Count"
                fill={BAR_COLOR}
                radius={[0, 2, 2, 0]}
                cursor="pointer"
                onMouseEnter={(barData) =>
                  setHoveredBar({ criteria: barData.criteria, count: barData.count })
                }
                onMouseLeave={() => setHoveredBar(null)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <PortalTooltip hovered={hoveredBar} mousePos={mousePos} />
      </CardContent>
    </Card>
  );
}
