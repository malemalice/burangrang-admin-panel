import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Plus, Trash2, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
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
  likelihoodLevel: string | null;
  likelihoodName: string;
  likelihoodDesc: string;
  consequenceLevel: number | null;
  consequenceName: string;
  consequenceDesc: string;
  riskRating: RiskRatingEnum;
  isActive: boolean;
  isNew?: boolean;
  isModified?: boolean;
  error?: string;
}

interface LikelihoodOption {
  level: string;
  name: string;
  desc: string;
}

interface ConsequenceOption {
  level: number;
  name: string;
  desc: string;
}

const RiskMatrixManagementPage = () => {
  const [likelihoods, setLikelihoods] = useState<LikelihoodOption[]>([]);
  const [consequences, setConsequences] = useState<ConsequenceOption[]>([]);
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<MatrixRow | null>(null);

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
      // likelihoodLevel is string (A, B, C...); consequenceLevel is number (1, 2, 3...)
      const uniqueLikelihoods = new Map<string, LikelihoodOption>();
      const uniqueConsequences = new Map<number, ConsequenceOption>();

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
        ['A', 'B', 'C', 'D', 'E'].forEach(level => {
          uniqueLikelihoods.set(level, {
            level,
            name: `Level ${level}`,
            desc: `Likelihood level ${level} description`,
          });
        });
      }

      if (uniqueConsequences.size === 0) {
        [1, 2, 3, 4, 5].forEach(level => {
          uniqueConsequences.set(level, {
            level,
            name: `Level ${level}`,
            desc: `Consequence level ${level} description`,
          });
        });
      }

      setLikelihoods(Array.from(uniqueLikelihoods.values()).sort((a, b) => String(a.level).localeCompare(String(b.level))));
      setConsequences(Array.from(uniqueConsequences.values()).sort((a, b) => a.level - b.level));

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
      likelihoodLevel: null,
      likelihoodName: '',
      likelihoodDesc: '',
      consequenceLevel: null,
      consequenceName: '',
      consequenceDesc: '',
      riskRating: RiskRatingEnum.LOW,
      isActive: true,
      isNew: true,
      isModified: false,
      error: undefined,
    };

    setMatrixRows([...matrixRows, newRow]);
  };

  const validatePairing = (rows: MatrixRow[], currentIndex: number, likelihoodLevel: string | null, consequenceLevel: number | null): string | undefined => {
    if (likelihoodLevel === null || consequenceLevel === null) {
      return undefined;
    }

    const duplicate = rows.find((row, index) => {
      if (index === currentIndex) return false;
      return row.likelihoodLevel === likelihoodLevel && row.consequenceLevel === consequenceLevel;
    });

    if (duplicate) {
      return `This pairing (${likelihoodLevel} and ${consequenceLevel}) already exists`;
    }

    return undefined;
  };

  const handleLevelInput = (index: number, field: 'likelihoodLevel' | 'consequenceLevel', value: string) => {
    // Only allow up to 2 characters
    if (value.length > 2) {
      return; // Don't update if more than 2 characters
    }

    // Auto-uppercase if it's an alphabet
    const processedValue = /[a-zA-Z]/.test(value) ? value.toUpperCase() : value;

    // Validate: letters (A-Z, AA-ZZ) for likelihood, numbers (1-99) for consequence
    if (field === 'likelihoodLevel') {
      // Allow empty, single letter (A-Z), or two letters (AA-ZZ)
      if (processedValue && !/^[A-Z]{1,2}$/.test(processedValue)) {
        return; // Invalid input, don't update
      }
      updateRow(index, field, processedValue || null);
    } else if (field === 'consequenceLevel') {
      // Allow empty, single digit (1-9), or two digits (10-99)
      if (processedValue && !/^([1-9]|[1-9][0-9])$/.test(processedValue)) {
        return; // Invalid input, don't update
      }
      const numValue = processedValue ? parseInt(processedValue, 10) : null;
      updateRow(index, field, numValue);
    }
  };

  const updateRow = (index: number, field: keyof MatrixRow, value: string | number | boolean | null) => {
    const updatedRows = [...matrixRows];
    const row = updatedRows[index];
    
    updatedRows[index] = {
      ...row,
      [field]: value,
      isModified: !row.isNew,
      error: undefined,
    };

    // Auto-fill likelihood or consequence details when level changes
    if (field === 'likelihoodLevel' && value !== null) {
      const likelihood = likelihoods.find((l) => l.level === value);
      if (likelihood) {
        updatedRows[index].likelihoodName = likelihood.name;
        updatedRows[index].likelihoodDesc = likelihood.desc;
      }
    } else if (field === 'consequenceLevel' && value !== null) {
      const consequence = consequences.find((c) => c.level === value);
      if (consequence) {
        updatedRows[index].consequenceName = consequence.name;
        updatedRows[index].consequenceDesc = consequence.desc;
      }
    }

    // Validate pairing uniqueness
    const newLikelihoodLevel = field === 'likelihoodLevel' ? (value as string | null) : row.likelihoodLevel;
    const newConsequenceLevel = field === 'consequenceLevel' ? (value as number | null) : row.consequenceLevel;
    
    const validationError = validatePairing(updatedRows, index, newLikelihoodLevel, newConsequenceLevel);
    if (validationError) {
      updatedRows[index].error = validationError;
    }

    setMatrixRows(updatedRows);
  };

  const deleteRow = (index: number) => {
    const row = matrixRows[index];
    if (row?.id) {
      setRowToDelete(row);
      setDeleteDialogOpen(true);
    } else {
      setMatrixRows((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!rowToDelete?.id) return;
    try {
      await riskMatrixService.deleteRiskMatrix(rowToDelete.id);
      setMatrixRows((prev) => prev.filter((r) => r.id !== rowToDelete.id));
      toast.success('Risk matrix entry deleted successfully');
    } catch (error) {
      console.error('Failed to delete risk matrix:', error);
      toast.error('Failed to delete risk matrix entry');
    } finally {
      setDeleteDialogOpen(false);
      setRowToDelete(null);
    }
  };

  const handleSaveAll = async () => {
    // Validate all rows before saving
    const validationErrors: string[] = [];
    
    matrixRows.forEach((row, index) => {
      // Check for missing required fields
      if (row.likelihoodLevel === null || row.consequenceLevel === null) {
        validationErrors.push(`Row ${index + 1}: Likelihood and Consequence levels are required`);
        return;
      }

      // Check for duplicate pairings
      const error = validatePairing(matrixRows, index, row.likelihoodLevel, row.consequenceLevel);
      if (error) {
        validationErrors.push(`Row ${index + 1}: ${error}`);
      }
    });

    if (validationErrors.length > 0) {
      toast.error(`Validation failed: ${validationErrors.join('; ')}`);
      return;
    }

    setIsSaving(true);
    try {
      const createPromises: Promise<RiskMatrix>[] = [];
      const updatePromises: Promise<RiskMatrix>[] = [];
      const deletePromises: Promise<void>[] = [];

      // Process new rows
      matrixRows.forEach((row) => {
        if (row.isNew && row.likelihoodLevel !== null && row.consequenceLevel !== null) {
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
        } else if (row.isModified && row.id && row.likelihoodLevel !== null && row.consequenceLevel !== null) {
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

  const buildMatrixGrid = () => {
    // likelihoodLevel is string (A, B, C...); consequenceLevel is number (1, 2, 3...)
    const likelihoodSet = new Set<string>();
    const consequenceSet = new Set<number>();
    const likelihoodNameMap = new Map<string, string>();
    const consequenceNameMap = new Map<number, string>();

    // Process all rows (including inactive ones for level extraction)
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

    // Sort likelihood levels: alphabetically (A, B, C, D, E)
    const likelihoodLevels = Array.from(likelihoodSet).sort((a, b) => a.localeCompare(b));
    
    // Sort consequence levels: numerically (1, 2, 3, 4, 5)
    const consequenceLevels = Array.from(consequenceSet).sort((a, b) => a - b);

    // Create a map for quick lookup: key = "likelihoodLevel-consequenceLevel"
    // Only include active entries for the matrix display
    const matrixMap = new Map<string, MatrixRow>();
    matrixRows.forEach((row) => {
      if (row.likelihoodLevel !== null && row.consequenceLevel !== null && row.isActive) {
        const key = `${row.likelihoodLevel}-${row.consequenceLevel}`;
        matrixMap.set(key, row);
      }
    });

    return { likelihoodLevels, consequenceLevels, matrixMap, likelihoodNameMap, consequenceNameMap };
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

  const hasChanges = matrixRows.some((row) => row.isNew || row.isModified);

  return (
    <div>
      <PageHeader
        title="Risk Matrix"
        subtitle="Manage risk matrix by defining likelihood and consequence pairs with their risk ratings"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAllData} disabled={isSaving} aria-label="Refresh risk matrix data">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setViewModalOpen(true)} aria-label="View risk matrix">
              <Eye className="mr-2 h-4 w-4" />
              View
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
            <Button onClick={addNewRow} aria-label="Add new risk matrix entry">
              <Plus className="mr-2 h-4 w-4" />
              Add New Entry
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
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
                    <th className="text-left p-4 font-semibold text-sm w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-12">
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
                          <Input
                            type="text"
                            placeholder="A-Z, AA-ZZ"
                            value={row.likelihoodLevel || ''}
                            onChange={(e) => handleLevelInput(index, 'likelihoodLevel', e.target.value)}
                            className={`h-8 text-sm text-center max-w-[80px] uppercase ${row.error ? 'border-destructive' : ''}`}
                            maxLength={2}
                            aria-label="Likelihood level"
                          />
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
                            {row.error && (
                              <p className="text-xs text-destructive mt-1">{row.error}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="1-99"
                            value={row.consequenceLevel?.toString() || ''}
                            onChange={(e) => handleLevelInput(index, 'consequenceLevel', e.target.value)}
                            className={`h-8 text-sm text-center max-w-[80px] ${row.error ? 'border-destructive' : ''}`}
                            maxLength={2}
                            aria-label="Consequence level"
                          />
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

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Risk Matrix View</DialogTitle>
            <DialogDescription>
              Visual representation of risk ratings based on likelihood and consequence levels
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {(() => {
              const { likelihoodLevels, consequenceLevels, matrixMap, likelihoodNameMap, consequenceNameMap } = buildMatrixGrid();
              return (
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
                                  cell ? getRiskRatingColor(cell.riskRating) : 'bg-background'
                                }`}
                              >
                                {cell ? (
                                  <div className="font-medium">
                                    {cell.riskRating}
                                  </div>
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
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setRowToDelete(null);
          }
        }}
        title="Delete Risk Matrix Entry"
        description="Are you sure you want to delete this risk matrix entry? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default RiskMatrixManagementPage;

