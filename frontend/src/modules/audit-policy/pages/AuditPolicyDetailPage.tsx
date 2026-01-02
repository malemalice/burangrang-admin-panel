import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, FileEdit, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';

import auditPolicyService from '../services/auditPolicyService';
import { AuditElement, AuditClause, AuditCriteria, CreateAuditClauseDTO, CreateAuditCriteriaDTO, TransitionTypeEnum } from '../types/audit-policy.types';
import { AuditClauseForm } from '../components/AuditClauseForm';
import { AuditCriteriaForm } from '../components/AuditCriteriaForm';

interface ClauseWithCriteria extends AuditClause {
  criteria: AuditCriteria[];
}

const getTransitionTypeBadge = (type: TransitionTypeEnum) => {
  const variants: Record<TransitionTypeEnum, 'default' | 'secondary' | 'outline'> = {
    [TransitionTypeEnum.INITIAL]: 'default',
    [TransitionTypeEnum.TRANSITION_LEVEL]: 'secondary',
    [TransitionTypeEnum.ADVANCE_LEVEL]: 'outline',
  };

  const labels: Record<TransitionTypeEnum, string> = {
    [TransitionTypeEnum.INITIAL]: 'Initial',
    [TransitionTypeEnum.TRANSITION_LEVEL]: 'Transition',
    [TransitionTypeEnum.ADVANCE_LEVEL]: 'Advance',
  };

  return (
    <Badge variant={variants[type]}>
      {labels[type]}
    </Badge>
  );
};

const AuditPolicyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [element, setElement] = useState<AuditElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Clauses with criteria
  const [clausesWithCriteria, setClausesWithCriteria] = useState<ClauseWithCriteria[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Dialog states
  const [isAddClauseDialogOpen, setIsAddClauseDialogOpen] = useState(false);
  const [isEditClauseDialogOpen, setIsEditClauseDialogOpen] = useState(false);
  const [isAddCriteriaDialogOpen, setIsAddCriteriaDialogOpen] = useState(false);
  const [isEditCriteriaDialogOpen, setIsEditCriteriaDialogOpen] = useState(false);
  const [editingClause, setEditingClause] = useState<AuditClause | null>(null);
  const [editingCriterion, setEditingCriterion] = useState<AuditCriteria | null>(null);
  const [clauseForNewCriteria, setClauseForNewCriteria] = useState<AuditClause | null>(null);
  const [clauseToDelete, setClauseToDelete] = useState<AuditClause | null>(null);
  const [criterionToDelete, setCriterionToDelete] = useState<AuditCriteria | null>(null);
  const [deleteClauseDialogOpen, setDeleteClauseDialogOpen] = useState(false);
  const [deleteCriteriaDialogOpen, setDeleteCriteriaDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch element
  useEffect(() => {
    const fetchElement = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const elementData = await auditPolicyService.getElementById(id);
        setElement(elementData);
      } catch (error) {
        console.error('Failed to fetch audit element:', error);
        toast.error('Failed to fetch audit element');
        navigate('/audit-policy');
      } finally {
        setIsLoading(false);
      }
    };

    fetchElement();
  }, [id, navigate]);

  // Fetch all clauses and their criteria
  const fetchAllData = useCallback(async () => {
    if (!id) return;
    
    setIsLoadingData(true);
    try {
      // Fetch all clauses
      const clausesResponse = await auditPolicyService.getClauses({
        auditElementId: id,
        page: 1,
        limit: 10000, // Large limit to get all
      });

      // Fetch criteria for each clause
      const clausesWithCriteriaData: ClauseWithCriteria[] = await Promise.all(
        clausesResponse.data.map(async (clause) => {
          const criteriaResponse = await auditPolicyService.getCriteria({
            auditClauseId: clause.id,
            page: 1,
            limit: 10000, // Large limit to get all
          });
          return {
            ...clause,
            criteria: criteriaResponse.data.sort((a, b) => a.order - b.order),
          };
        })
      );

      // Sort clauses by order
      clausesWithCriteriaData.sort((a, b) => a.order - b.order);
      setClausesWithCriteria(clausesWithCriteriaData);
    } catch (error) {
      console.error('Failed to fetch clauses and criteria:', error);
      toast.error('Failed to fetch clauses and criteria');
    } finally {
      setIsLoadingData(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddClause = async (clauseData: CreateAuditClauseDTO) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await auditPolicyService.createClause(clauseData);
      toast.success('Clause created successfully');
      setIsAddClauseDialogOpen(false);
      fetchAllData();
    } catch (error) {
      console.error('Failed to create clause:', error);
      toast.error('Failed to create clause');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClause = (clause: AuditClause) => {
    setEditingClause(clause);
    setIsEditClauseDialogOpen(true);
  };

  const handleUpdateClause = async (clauseData: CreateAuditClauseDTO) => {
    if (!editingClause) return;
    
    setIsSubmitting(true);
    try {
      await auditPolicyService.updateClause(editingClause.id, clauseData);
      toast.success('Clause updated successfully');
      setIsEditClauseDialogOpen(false);
      setEditingClause(null);
      fetchAllData();
    } catch (error) {
      console.error('Failed to update clause:', error);
      toast.error('Failed to update clause');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClauseClick = (clause: AuditClause) => {
    setClauseToDelete(clause);
    setDeleteClauseDialogOpen(true);
  };

  const handleDeleteClauseConfirm = async () => {
    if (!clauseToDelete) return;
    
    setIsSubmitting(true);
    try {
      await auditPolicyService.deleteClause(clauseToDelete.id);
      toast.success('Clause deleted successfully');
      setDeleteClauseDialogOpen(false);
      setClauseToDelete(null);
      fetchAllData();
    } catch (error) {
      console.error('Failed to delete clause:', error);
      toast.error('Failed to delete clause');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCriteriaClick = (clause: AuditClause) => {
    setClauseForNewCriteria(clause);
    setIsAddCriteriaDialogOpen(true);
  };

  const handleAddCriterion = async (criterionData: CreateAuditCriteriaDTO) => {
    setIsSubmitting(true);
    try {
      await auditPolicyService.createCriterion(criterionData);
      toast.success('Criteria created successfully');
      setIsAddCriteriaDialogOpen(false);
      setClauseForNewCriteria(null);
      fetchAllData();
    } catch (error) {
      console.error('Failed to create criteria:', error);
      toast.error('Failed to create criteria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCriterion = (criterion: AuditCriteria) => {
    setEditingCriterion(criterion);
    setIsEditCriteriaDialogOpen(true);
  };

  const handleUpdateCriterion = async (criterionData: CreateAuditCriteriaDTO) => {
    if (!editingCriterion) return;
    
    setIsSubmitting(true);
    try {
      await auditPolicyService.updateCriterion(editingCriterion.id, criterionData);
      toast.success('Criteria updated successfully');
      setIsEditCriteriaDialogOpen(false);
      setEditingCriterion(null);
      fetchAllData();
    } catch (error) {
      console.error('Failed to update criteria:', error);
      toast.error('Failed to update criteria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCriterionClick = (criterion: AuditCriteria) => {
    setCriterionToDelete(criterion);
    setDeleteCriteriaDialogOpen(true);
  };

  const handleDeleteCriterionConfirm = async () => {
    if (!criterionToDelete) return;
    
    setIsSubmitting(true);
    try {
      await auditPolicyService.deleteCriterion(criterionToDelete.id);
      toast.success('Criteria deleted successfully');
      setDeleteCriteriaDialogOpen(false);
      setCriterionToDelete(null);
      fetchAllData();
    } catch (error) {
      console.error('Failed to delete criteria:', error);
      toast.error('Failed to delete criteria');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <span>Loading audit policy element...</span>
        </div>
      </div>
    );
  }

  if (!element) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Audit Element not found</h2>
        <p className="text-gray-600 mb-4">The audit element you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/audit-policy')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Audit Policy
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${element.code} - ${element.name}`}
        subtitle={element.description || `Created on ${format(new Date(element.createdAt), 'dd MMM yyyy')}`}
        actions={
          <Button 
            variant="outline"
            onClick={() => navigate(`/audit-policy/${id}/edit`)}
          >
            <FileEdit className="h-4 w-4 mr-2" />
            Edit Element
          </Button>
        }
      />

      {/* Clauses and Criteria Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clauses and Criteria</CardTitle>
              <CardDescription>Manage clauses and their criteria for this audit element</CardDescription>
            </div>
            <Button onClick={() => setIsAddClauseDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Clause
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <span>Loading clauses and criteria...</span>
              </div>
            </div>
          ) : clausesWithCriteria.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No clauses yet. Click "Add Clause" to get started.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {clausesWithCriteria.map((clause) => (
                <div key={clause.id} className="space-y-4">
                  {/* Clause Header */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {clause.code} {clause.name}
                          </h3>
                        </div>
                        {clause.description && (
                          <p className="text-sm text-gray-600 mt-1">{clause.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddCriteriaClick(clause)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Criteria
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClause(clause)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClauseClick(clause)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Criteria Table */}
                  {clause.criteria.length > 0 ? (
                    <div className="ml-4 border-l-2 border-gray-200 pl-6">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-24">
                                No
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                Criteria
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                Interpretation
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-32">
                                Type
                              </th>
                              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 w-32">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {clause.criteria.map((criterion, index) => (
                              <tr
                                key={criterion.id}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                                  {clause.code}.{criterion.order}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900">
                                  {criterion.name}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {criterion.description || '-'}
                                </td>
                                <td className="py-3 px-4">
                                  {getTransitionTypeBadge(criterion.transitionType)}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditCriterion(criterion)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteCriterionClick(criterion)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="ml-4 border-l-2 border-gray-200 pl-6">
                      <div className="py-4 text-center text-sm text-gray-500">
                        No criteria yet. Click "Add Criteria" to add one.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Clause Dialog */}
      <Dialog open={isAddClauseDialogOpen} onOpenChange={setIsAddClauseDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Clause</DialogTitle>
            <DialogDescription>
              Add a new clause to this audit element.
            </DialogDescription>
          </DialogHeader>
          <AuditClauseForm
            auditElementId={id!}
            onSubmit={handleAddClause}
            onCancel={() => setIsAddClauseDialogOpen(false)}
            showCard={false}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Clause Dialog */}
      <Dialog open={isEditClauseDialogOpen} onOpenChange={(open) => {
        setIsEditClauseDialogOpen(open);
        if (!open) {
          setEditingClause(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Clause</DialogTitle>
            <DialogDescription>
              Update the clause details.
            </DialogDescription>
          </DialogHeader>
          {editingClause && (
            <AuditClauseForm
              auditElementId={id!}
              initialClause={{
                name: editingClause.name,
                code: editingClause.code,
                description: editingClause.description || undefined,
                order: editingClause.order,
                isActive: editingClause.isActive,
              }}
              onSubmit={handleUpdateClause}
              onCancel={() => {
                setIsEditClauseDialogOpen(false);
                setEditingClause(null);
              }}
              showCard={false}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Criteria Dialog */}
      <Dialog open={isAddCriteriaDialogOpen} onOpenChange={(open) => {
        setIsAddCriteriaDialogOpen(open);
        if (!open) {
          setClauseForNewCriteria(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Criteria</DialogTitle>
            <DialogDescription>
              Add a new criteria to clause {clauseForNewCriteria?.code}
            </DialogDescription>
          </DialogHeader>
          {clauseForNewCriteria && (
            <AuditCriteriaForm
              auditClauseId={clauseForNewCriteria.id}
              onSubmit={handleAddCriterion}
              onCancel={() => {
                setIsAddCriteriaDialogOpen(false);
                setClauseForNewCriteria(null);
              }}
              showCard={false}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Criteria Dialog */}
      <Dialog open={isEditCriteriaDialogOpen} onOpenChange={(open) => {
        setIsEditCriteriaDialogOpen(open);
        if (!open) {
          setEditingCriterion(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Criteria</DialogTitle>
            <DialogDescription>
              Update the criteria details.
            </DialogDescription>
          </DialogHeader>
          {editingCriterion && (
            <AuditCriteriaForm
              auditClauseId={editingCriterion.auditClauseId}
              initialCriterion={{
                name: editingCriterion.name,
                code: editingCriterion.code,
                description: editingCriterion.description || undefined,
                transitionType: editingCriterion.transitionType,
                order: editingCriterion.order,
                isActive: editingCriterion.isActive,
              }}
              onSubmit={handleUpdateCriterion}
              onCancel={() => {
                setIsEditCriteriaDialogOpen(false);
                setEditingCriterion(null);
              }}
              showCard={false}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Clause Confirmation */}
      <ConfirmDialog
        open={deleteClauseDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteClauseDialogOpen(false);
            setClauseToDelete(null);
          }
        }}
        title="Delete Clause"
        description={`Are you sure you want to delete "${clauseToDelete?.name}"? This action cannot be undone and will also delete all associated criteria.`}
        onConfirm={handleDeleteClauseConfirm}
        variant="destructive"
      />

      {/* Delete Criteria Confirmation */}
      <ConfirmDialog
        open={deleteCriteriaDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCriteriaDialogOpen(false);
            setCriterionToDelete(null);
          }
        }}
        title="Delete Criteria"
        description={`Are you sure you want to delete "${criterionToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteCriterionConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default AuditPolicyDetailPage;