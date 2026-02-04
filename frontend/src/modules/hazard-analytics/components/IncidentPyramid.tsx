import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';

const PYRAMID_LAYERS = [
  { label: 'Fatality', ratio: 1, color: '#DC2626' },
  { label: 'Major Accident', ratio: 30, color: '#EA580C' },
  { label: 'Recordable Injuries\n(Minor Accident)', ratio: 300, color: '#F97316' },
  { label: 'Near Misses', ratio: 3000, color: '#FBBF24' },
  { label: 'Hazards', ratio: 30000, color: '#FDE047' },
];

export function IncidentPyramid() {
  const pyramidWidth = 280;
  const pyramidHeight = 300;
  const layerCount = PYRAMID_LAYERS.length;
  const layerHeight = pyramidHeight / layerCount;

  // Calculate trapezoid points for each layer
  const getLayerPoints = (index: number) => {
    const topWidth = (pyramidWidth * index) / layerCount;
    const bottomWidth = (pyramidWidth * (index + 1)) / layerCount;
    const topY = index * layerHeight;
    const bottomY = (index + 1) * layerHeight;
    const centerX = pyramidWidth / 2;

    const topLeft = centerX - topWidth / 2;
    const topRight = centerX + topWidth / 2;
    const bottomLeft = centerX - bottomWidth / 2;
    const bottomRight = centerX + bottomWidth / 2;

    return `${topLeft},${topY} ${topRight},${topY} ${bottomRight},${bottomY} ${bottomLeft},${bottomY}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Incident Pyramid (Bird Triangle)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-4">
          {/* Pyramid SVG */}
          <svg
            width={pyramidWidth}
            height={pyramidHeight}
            viewBox={`0 0 ${pyramidWidth} ${pyramidHeight}`}
            className="flex-shrink-0"
          >
            {PYRAMID_LAYERS.map((layer, index) => {
              const topY = index * layerHeight;
              const centerY = topY + layerHeight / 2;
              const lines = layer.label.split('\n');

              return (
                <g key={layer.label}>
                  <polygon
                    points={getLayerPoints(index)}
                    fill={layer.color}
                    stroke="white"
                    strokeWidth="1"
                  />
                  {lines.map((line, lineIndex) => (
                    <text
                      key={lineIndex}
                      x={pyramidWidth / 2}
                      y={centerY + (lineIndex - (lines.length - 1) / 2) * 14}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={index === 0 ? 'white' : '#1F2937'}
                      fontSize={index === 0 ? '11' : '12'}
                      fontWeight="500"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>

          {/* Arrow and Ratio Scale */}
          <div className="flex items-center gap-2">
            {/* Upward Arrow */}
            <div className="relative h-[300px] w-6 flex items-center justify-center">
              <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center">
                {/* Arrow head */}
                <div
                  className="w-0 h-0 flex-shrink-0"
                  style={{
                    borderLeft: '12px solid transparent',
                    borderRight: '12px solid transparent',
                    borderBottom: '16px solid #CBD5E1',
                  }}
                />
                {/* Arrow body */}
                <div className="flex-1 w-3 bg-slate-300" />
              </div>
            </div>

            {/* Ratio boxes */}
            <div className="flex flex-col gap-1">
              {PYRAMID_LAYERS.map((layer) => (
                <div
                  key={layer.ratio}
                  className="h-[56px] min-w-[70px] flex items-center justify-center text-sm font-semibold border border-gray-300"
                  style={{
                    backgroundColor: layer.color,
                    color: layer.ratio === 1 ? 'white' : '#1F2937',
                  }}
                >
                  {layer.ratio.toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
