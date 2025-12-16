import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import riskMatrixService from '../services/riskMatrixService';
import {
  RiskMatrix,
  RiskRatingEnum,
  CreateRiskMatrixDTO,
  UpdateRiskMatrixDTO,
} from '../types/risk-matrix.types';
import { Loader2 } from 'lucide-react';

interface MatrixRow {
  id?: string;
  likelihoodLevel: number;
  likelihoodName: string;
  likelihoodDesc: string;
  consequenceLevel: string;
  consequenceName: string;
  consequenceDesc: string;
  riskRating: RiskRatingEnum;
  isActive: boolean;
  isNew?: boolean;
  isModified?: boolean;
}

interface LikelihoodOption {
  level: number;
  name: string;
  desc: string;
}

interface ConsequenceOption {
  level: string;
  name: string;
  desc: string;
}

const RiskMatrixManagementPage = () => {
  const [likelihoods, setLikelihoods] = useState<LikelihoodOption[]>([]);
  const [consequences, setConsequences] = useState<ConsequenceOption[]>([]);
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const matricesRes = await riskMatrixService.getRiskMatrices({ 
        page: 1, 
        limit: 1000, 
        sortBy: 'likelihoodLevel', 
        sortOrder: 'asc' 
      });

      // Extract unique likelihoods and consequences from existing matrix data
      const uniqueLikelihoods = new Map<number, LikelihoodOption>();
      const uniqueConsequences = new Map<string, ConsequenceOption>();

      matricesRes.data.forEach((matrix) => {
        if (!uniqueLikelihoods.has(matrix.likelihoodLevel)) {
          uniqueLikelihoods.set(matrix.likelihoodLevel, {
            level: matrix.likelihoodLevel,
            name: matrix.likelihoodName,
            desc: matrix.likelihoodDesc,
          });
        }
        if (!uniqueConsequences.has(matrix.consequenceLevel)) {
          uniqueConsequences.set(matrix.consequenceLevel, {
            level: matrix.consequenceLevel,
            name: matrix.consequenceName,
            desc: matrix.consequenceDesc,
          });
        }
      });

      // Add default values if no data exists
      if (uniqueLikelihoods.size === 0) {
        [1, 2, 3, 4, 5].forEach(level => {
          uniqueLikelihoods.set(level, {
            level,
            name: `Level ${level}`,
            desc: `Likelihood level ${level} description`,
          });
        });
      }

      if (uniqueConsequences.size === 0) {
        ['A', 'B', 'C', 'D', 'E'].forEach(level => {
          uniqueConsequences.set(level, {
            level,
            name: `Level ${level}`,
            desc: `Consequence level ${level} description`,
          });
        });
      }

      setLikelihoods(Array.from(uniqueLikelihoods.values()).sort((a, b) => a.level - b.level));
      setConsequences(Array.from(uniqueConsequences.values()).sort((a, b) => a.level.localeCompare(b.level)));

      // Convert matrices to rows
      const rows: MatrixRow[] = matricesRes.data.map((matrix) => ({
        id: matrix.id,
        likelihoodLevel: matrix.likelihoodLevel,
        likelihoodName: matrix.likelihoodName,
        likelihoodDesc: matrix.likelihoodDesc,
        consequenceLevel: matrix.consequenceLevel,
        consequenceName: matrix.consequenceName,
        consequenceDesc: matrix.consequenceDesc,
        riskRating: matrix.riskRating,
        isActive: matrix.isActive,
        isNew: false,
        isModified: false,
      }));

      setMatrixRows(rows);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load risk matrix data');
    } finally {
      setIsLoading(false);
    }
  };

  const addNewRow = () => {
    const newRow: MatrixRow = {
      likelihoodLevel: likelihoods[0]?.level || 1,
      likelihoodName: likelihoods[0]?.name || '',
      likelihoodDesc: likelihoods[0]?.desc || '',
      consequenceLevel: consequences[0]?.level || 'A',
      consequenceName: consequences[0]?.name || '',
      consequenceDesc: consequences[0]?.desc || '',
      riskRating: RiskRatingEnum.LOW,
      isActive: true,
      isNew: true,
      isModified: false,
    };

    setMatrixRows([...matrixRows, newRow]);
  };

  const updateRow = (index: number, field: keyof MatrixRow, value: string | number | boolean) => {
    const updatedRows = [...matrixRows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
      isModified: !updatedRows[index].isNew,
    };

    // Auto-fill likelihood or consequence details when level changes
    if (field === 'likelihoodLevel') {
      const likelihood = likelihoods.find((l) => l.level === value);
      if (likelihood) {
        updatedRows[index].likelihoodName = likelihood.name;
        updatedRows[index].likelihoodDesc = likelihood.desc;
      }
    } else if (field === 'consequenceLevel') {
      const consequence = consequences.find((c) => c.level === value);
      if (consequence) {
        updatedRows[index].consequenceName = consequence.name;
        updatedRows[index].consequenceDesc = consequence.desc;
      }
    }

    setMatrixRows(updatedRows);
  };

  const deleteRow = (index: number) => {
    const updatedRows = matrixRows.filter((_, i) => i !== index);
    setMatrixRows(updatedRows);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const createPromises: Promise<RiskMatrix>[] = [];
      const updatePromises: Promise<RiskMatrix>[] = [];
      const deletePromises: Promise<void>[] = [];

      // Process new rows
      matrixRows.forEach((row) => {
        if (row.isNew) {
          const createDto: CreateRiskMatrixDTO = {
            likelihoodLevel: row.likelihoodLevel,
            likelihoodName: row.likelihoodName,
            likelihoodDesc: row.likelihoodDesc,
            consequenceLevel: row.consequenceLevel,
            consequenceName: row.consequenceName,
            consequenceDesc: row.consequenceDesc,
            risk_rating: row.riskRating,
            isActive: row.isActive,
          };
          createPromises.push(riskMatrixService.createRiskMatrix(createDto));
        } else if (row.isModified && row.id) {
          const updateDto: UpdateRiskMatrixDTO = {
            likelihoodLevel: row.likelihoodLevel,
            likelihoodName: row.likelihoodName,
            likelihoodDesc: row.likelihoodDesc,
            consequenceLevel: row.consequenceLevel,
            consequenceName: row.consequenceName,
            consequenceDesc: row.consequenceDesc,
            risk_rating: row.riskRating,
            isActive: row.isActive,
          };
          updatePromises.push(riskMatrixService.updateRiskMatrix(row.id, updateDto));
        }
      });

      await Promise.all([...createPromises, ...updatePromises, ...deletePromises]);

      toast.success('Risk matrix updated successfully');
      await fetchAllData();
    } catch (error) {
      console.error('Failed to save risk matrix:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const getRiskRatingBadgeVariant = (rating: RiskRatingEnum) => {
    switch (rating) {
      case RiskRatingEnum.LOW:
        return 'bg-green-100 text-green-800 border-0';
      case RiskRatingEnum.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-0';
      case RiskRatingEnum.HIGH:
        return 'bg-orange-100 text-orange-800 border-0';
      case RiskRatingEnum.EXTREME:
        return 'bg-red-100 text-red-800 border-0';
      default:
        return 'bg-gray-100 text-gray-800 border-0';
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

  const hasChanges = matrixRows.some((row) => row.isNew || row.isModified);

  return (
    <div>
      <PageHeader
        title="Probability and Consequences Classification Level"
        subtitle="Manage risk matrix by defining likelihood and consequence pairs with their risk ratings"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAllData} disabled={isSaving} aria-label="Refresh risk matrix data">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleSaveAll} disabled={!hasChanges || isSaving} aria-label="Save all changes">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold">Risk Matrix Configuration</CardTitle>
              <CardDescription className="mt-1.5">
                Add or modify risk matrix entries below. Each row represents a combination of probability (likelihood)
                and consequence levels.
              </CardDescription>
            </div>
            <Button onClick={addNewRow} size="sm" aria-label="Add new risk matrix entry">
              <Plus className="mr-2 h-4 w-4" />
              Add New Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Risk matrix entries">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm">Likelihood Level</th>
                    <th className="text-left p-4 font-semibold text-sm min-w-[300px]">Likelihood Name & Description</th>
                    <th className="text-left p-4 font-semibold text-sm">Consequence Level</th>
                    <th className="text-left p-4 font-semibold text-sm min-w-[300px]">Consequence Name & Description</th>
                    <th className="text-left p-4 font-semibold text-sm">Risk Rating</th>
                    <th className="text-left p-4 font-semibold text-sm">Status</th>
                    <th className="text-left p-4 font-semibold text-sm w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="text-muted-foreground">
                            <p className="text-base font-medium mb-2">No risk matrix entries found</p>
                            <p className="text-sm">Click "Add New Entry" to create your first risk matrix entry.</p>
                          </div>
                          <Button onClick={addNewRow} variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Entry
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    matrixRows.map((row, index) => (
                      <tr
                        key={index}
                        className={`border-b hover:bg-muted/30 transition-colors ${
                          row.isNew ? 'bg-blue-50/50 dark:bg-blue-950/20' : row.isModified ? 'bg-yellow-50/50 dark:bg-yellow-950/20' : ''
                        }`}
                      >
                        <td className="p-4">
                          <Select
                            value={row.likelihoodLevel.toString()}
                            onValueChange={(value) => updateRow(index, 'likelihoodLevel', parseInt(value))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {likelihoods.map((likelihood) => (
                                <SelectItem key={likelihood.level} value={likelihood.level.toString()}>
                                  {likelihood.level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
                          <div className="space-y-2">
                            <Input
                              placeholder="Likelihood name"
                              value={row.likelihoodName}
                              onChange={(e) => updateRow(index, 'likelihoodName', e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Input
                              placeholder="Likelihood description"
                              value={row.likelihoodDesc}
                              onChange={(e) => updateRow(index, 'likelihoodDesc', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <Select
                            value={row.consequenceLevel}
                            onValueChange={(value) => updateRow(index, 'consequenceLevel', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {consequences.map((consequence) => (
                                <SelectItem key={consequence.level} value={consequence.level}>
                                  {consequence.level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
                          <div className="space-y-2">
                            <Input
                              placeholder="Consequence name"
                              value={row.consequenceName}
                              onChange={(e) => updateRow(index, 'consequenceName', e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Input
                              placeholder="Consequence description"
                              value={row.consequenceDesc}
                              onChange={(e) => updateRow(index, 'consequenceDesc', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <Select
                            value={row.riskRating}
                            onValueChange={(value) => updateRow(index, 'riskRating', value as RiskRatingEnum)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={RiskRatingEnum.LOW}>
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-0">
                                  LOW
                                </Badge>
                              </SelectItem>
                              <SelectItem value={RiskRatingEnum.MEDIUM}>
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-0">
                                  MEDIUM
                                </Badge>
                              </SelectItem>
                              <SelectItem value={RiskRatingEnum.HIGH}>
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-0">
                                  HIGH
                                </Badge>
                              </SelectItem>
                              <SelectItem value={RiskRatingEnum.EXTREME}>
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-0">
                                  EXTREME
                                </Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
                          <Select
                            value={row.isActive ? 'active' : 'inactive'}
                            onValueChange={(value) => updateRow(index, 'isActive', value === 'active')}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-0">
                                  Active
                                </Badge>
                              </SelectItem>
                              <SelectItem value="inactive">
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-0">
                                  Inactive
                                </Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteRow(index)} 
                            disabled={isSaving}
                            aria-label={`Delete row ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {hasChanges && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>You have unsaved changes.</strong> Click "Save All Changes" to apply your modifications.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskMatrixManagementPage;

