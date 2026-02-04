import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';

const PYRAMID_LAYERS = [
  { label: 'Fatality', ratio: 1, color: 'bg-red-600' },
  { label: 'Major Accident', ratio: 30, color: 'bg-orange-600' },
  { label: 'Recordable Injuries (Minor Accident)', ratio: 300, color: 'bg-orange-500' },
  { label: 'Near Misses', ratio: 3000, color: 'bg-amber-400' },
  { label: 'Hazards', ratio: 30000, color: 'bg-yellow-400' },
];

export function IncidentPyramid() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Incident Pyramid (Bird Triangle)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col items-center">
              {PYRAMID_LAYERS.map((layer, i) => (
                <div
                  key={layer.label}
                  className={`w-full ${layer.color} text-white text-center text-xs py-1 px-2 border border-white/20 min-h-[28px] flex items-center justify-center`}
                  style={{
                    width: `${20 + i * 16}%`,
                  }}
                >
                  {layer.label}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            {PYRAMID_LAYERS.map((layer) => (
              <div
                key={layer.label}
                className={`h-6 px-2 flex items-center justify-end text-xs font-medium ${layer.color} text-white rounded`}
              >
                {layer.ratio.toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
