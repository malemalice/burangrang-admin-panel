import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, RefreshCw } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import riskMatrixService from '../services/riskMatrixService';
import { RiskRatingEnum } from '../types/risk-matrix.types';
import { Loader2 } from 'lucide-react';

interface MatrixRow {
  id?: string;
  likelihoodLevel: string | null;
  likelihoodName: string;
  likelihoodDesc: string;
  consequenceLevel: number | null;
  consequenceName: string;
  consequenceDesc: string;
  interpretation: RiskRatingEnum;
  isActive: boolean;
}

const RiskMatrixViewPage = () => {
  const navigate = useNavigate();
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await riskMatrixService.getRiskMatrices({
        page: 1,
        limit: 1000,
        sortBy: 'likelihoodLevel',
        sortOrder: 'asc',
      });
      setMatrixRows(
        res.data.map((m) => ({
          id: m.id,
          likelihoodLevel: m.likelihoodLevel,
          likelihoodName: m.likelihoodName,
          likelihoodDesc: m.likelihoodDesc,
          consequenceLevel: m.consequenceLevel,
          consequenceName: m.consequenceName,
          consequenceDesc: m.consequenceDesc,
          interpretation: m.interpretation,
          isActive: m.isActive,
        }))
      );
    } catch (error) {
      console.error('Failed to fetch risk matrix:', error);
      toast.error('Failed to load risk matrix data');
    } finally {
      setIsLoading(false);
    }
  };

  const buildMatrixGrid = () => {
    const likelihoodSet = new Set<string>();
    const consequenceSet = new Set<number>();
    const likelihoodNameMap = new Map<string, string>();
    const consequenceNameMap = new Map<number, string>();

    matrixRows.forEach((row) => {
      if (row.likelihoodLevel !== null) {
        likelihoodSet.add(row.likelihoodLevel);
        if (row.likelihoodName) {
          likelihoodNameMap.set(row.likelihoodLevel, row.likelihoodName);
        }
      }
      if (row.consequenceLevel !== null) {
        consequenceSet.add(row.consequenceLevel);
        if (row.consequenceName) {
          consequenceNameMap.set(row.consequenceLevel, row.consequenceName);
        }
      }
    });

    const likelihoodLevels = Array.from(likelihoodSet).sort((a, b) => a.localeCompare(b));
    const consequenceLevels = Array.from(consequenceSet).sort((a, b) => a - b);

    const matrixMap = new Map<string, MatrixRow>();
    matrixRows.forEach((row) => {
      if (row.likelihoodLevel !== null && row.consequenceLevel !== null && row.isActive) {
        matrixMap.set(`${row.likelihoodLevel}-${row.consequenceLevel}`, row);
      }
    });

    return { likelihoodLevels, consequenceLevels, matrixMap, likelihoodNameMap, consequenceNameMap };
  };

  const buildClassificationData = () => {
    const probabilityMap = new Map<string, { level: string; name: string; desc: string }>();
    const consequenceMap = new Map<number, { level: number; name: string; desc: string }>();

    matrixRows.forEach((row) => {
      if (row.likelihoodLevel !== null && !probabilityMap.has(row.likelihoodLevel)) {
        probabilityMap.set(row.likelihoodLevel, {
          level: row.likelihoodLevel,
          name: row.likelihoodName,
          desc: row.likelihoodDesc,
        });
      }
      if (row.consequenceLevel !== null && !consequenceMap.has(row.consequenceLevel)) {
        consequenceMap.set(row.consequenceLevel, {
          level: row.consequenceLevel,
          name: row.consequenceName,
          desc: row.consequenceDesc,
        });
      }
    });

    const probabilities = Array.from(probabilityMap.values()).sort((a, b) => b.level.localeCompare(a.level));
    const consequences = Array.from(consequenceMap.values()).sort((a, b) => b.level - a.level);

    return { probabilities, consequences };
  };

  const getRiskRatingColor = (rating: RiskRatingEnum) => {
    switch (rating) {
      case RiskRatingEnum.LOW:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case RiskRatingEnum.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case RiskRatingEnum.HIGH:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case RiskRatingEnum.EXTREME:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading risk matrix data...</span>
        </div>
      </div>
    );
  }

  const { likelihoodLevels, consequenceLevels, matrixMap, likelihoodNameMap, consequenceNameMap } = buildMatrixGrid();
  const { probabilities, consequences } = buildClassificationData();

  return (
    <div>
      <PageHeader
        title="Risk Matrix"
        subtitle="Visual representation of risk ratings based on likelihood and consequence levels"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => navigate('/risk-matrix/edit')} aria-label="Edit risk matrix">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-3 bg-muted/50 font-semibold text-sm sticky top-0 z-10">
                Likelihood \ Consequence
              </th>
              {consequenceLevels.map((level) => (
                <th
                  key={level}
                  className="border p-3 bg-muted/50 font-semibold text-sm text-center sticky top-0 z-10"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{level}</span>
                    {consequenceNameMap.get(level) && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {consequenceNameMap.get(level)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {likelihoodLevels.map((likelihood) => (
              <tr key={likelihood}>
                <td className="border p-3 bg-muted/30 font-semibold text-sm text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>{likelihood}</span>
                    {likelihoodNameMap.get(likelihood) && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {likelihoodNameMap.get(likelihood)}
                      </span>
                    )}
                  </div>
                </td>
                {consequenceLevels.map((consequence) => {
                  const key = `${likelihood}-${consequence}`;
                  const cell = matrixMap.get(key);
                  return (
                    <td
                      key={consequence}
                      className={`border p-4 text-center align-middle min-w-[100px] ${
                        cell ? getRiskRatingColor(cell.interpretation) : 'bg-background'
                      }`}
                    >
                      {cell ? (
                        <div className="font-medium">{cell.interpretation}</div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {likelihoodLevels.length === 0 && consequenceLevels.length === 0 && (
        <div className="text-center p-12 text-muted-foreground">
          <p className="text-base font-medium mb-2">No risk matrix entries found</p>
          <p className="text-sm">Click &quot;Edit&quot; to add and manage risk matrix entries.</p>
        </div>
      )}

      {(probabilities.length > 0 || consequences.length > 0) && (
        <div className="mt-8">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-lime-500 p-3 text-center">
              <h2 className="font-bold text-sm uppercase">Probability and Consequences Classification Level</h2>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-3 font-semibold text-sm text-center">Probability Level</th>
                  <th className="border p-3 font-semibold text-sm text-center bg-yellow-200">Probability Level</th>
                  <th className="border p-3 font-semibold text-sm text-center">Consequences Level</th>
                  <th className="border p-3 font-semibold text-sm text-center bg-yellow-200">Consequences Level</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.max(probabilities.length, consequences.length) }).map((_, index) => {
                  const probability = probabilities[index];
                  const consequence = consequences[index];
                  return (
                    <tr key={index} className="bg-yellow-50">
                      <td className="border p-3 text-sm">
                        {probability ? (
                          <div>
                            <div className="font-semibold">{probability.name}</div>
                            <div className="text-xs mt-1">{probability.desc}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="border p-3 text-center bg-yellow-100 font-semibold">
                        {probability ? probability.level : '-'}
                      </td>
                      <td className="border p-3 text-sm">
                        {consequence ? (
                          <div>
                            <div className="font-semibold">{consequence.name}</div>
                            <div className="text-xs mt-1">{consequence.desc}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="border p-3 text-center bg-yellow-100 font-semibold">
                        {consequence ? consequence.level : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskMatrixViewPage;
