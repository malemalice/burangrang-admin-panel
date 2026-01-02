import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, FileEdit } from 'lucide-react';
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

import auditPolicyService from '../services/auditPolicyService';
import { AuditElement, AuditClause, AuditCriteria, CreateAuditClauseDTO, CreateAuditCriteriaDTO } from '../types/audit-policy.types';
import { AuditClausesTable } from '../components/AuditClausesTable';
import { AuditCriteriaTable } from '../components/AuditCriteriaTable';
import { AuditClauseForm } from '../components/AuditClauseForm';
import { AuditCriteriaForm } from '../components/AuditCriteriaForm';
import { FilterValue } from '@/core/components/ui/filter-drawer';

const AuditPolicyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [element, setElement] = useState<AuditElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Clauses state
  const [clauses, setClauses] = useState<AuditClause[]>([]);
  const [isLoadingClauses, setIsLoadingClauses] = useState(false);
  const [clausePageIndex, setClausePageIndex] = useState(0);
  const [clauseLimit, setClauseLimit] = useState(10);
  const [totalClauses, setTotalClauses] = useState(0);
  
  // Criteria state
  const [criteria, setCriteria] = useState<AuditCriteria[]>([]);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);
  const [criteriaPageIndex, setCriteriaPageIndex] = useState(0);
  const [criteriaLimit, setCriteriaLimit] = useState(10);
  const [totalCriteria, setTotalCriteria] = useState(0);
  const [selectedClause, setSelectedClause] = useState<AuditClause | null>(null);
  
  // Dialog states
  const [isAddClauseDialogOpen, setIsAddClauseDialogOpen] = useState(false);
  const [isEditClauseDialogOpen, setIsEditClauseDialogOpen] = useState(false);
  const [isViewCriteriaDialogOpen, setIsViewCriteriaDialogOpen] = useState(false);
  const [isAddCriteriaDialogOpen, setIsAddCriteriaDialogOpen] = useState(false);
  const [isEditCriteriaDialogOpen, setIsEditCriteriaDialogOpen] = useState(false);
  const [editingClause, setEditingClause] = useState<AuditClause | null>(null);
  const [editingCriterion, setEditingCriterion] = useState<AuditCriteria | null>(null);
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

  // Fetch clauses
  const fetchClauses = useCallback(async () => {
    if (!id) return;
    
    setIsLoadingClauses(true);
    try {
      const params: any = {
        page: clausePageIndex + 1,
        limit: clauseLimit,
        auditElementId: id,
      };

      const response = await auditPolicyService.getClauses(params);
      setClauses(response.data);
      setTotalClauses(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch clauses:', error);
      toast.error('Failed to fetch clauses');
    } finally {
      setIsLoadingClauses(false);
    }
  }, [id, clausePageIndex, clauseLimit]);

  useEffect(() => {
    fetchClauses();
  }, [fetchClauses]);

  // Fetch criteria
  const fetchCriteria = useCallback(async () => {
    if (!selectedClause) return;
    
    setIsLoadingCriteria(true);
    try {
      const params: any = {
        page: criteriaPageIndex + 1,
        limit: criteriaLimit,
        auditClauseId: selectedClause.id,
      };

      const response = await auditPolicyService.getCriteria(params);
      setCriteria(response.data);
      setTotalCriteria(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch criteria:', error);
      toast.error('Failed to fetch criteria');
    } finally {
      setIsLoadingCriteria(false);
    }
  }, [selectedClause, criteriaPageIndex, criteriaLimit]);

  useEffect(() => {
    if (selectedClause && isViewCriteriaDialogOpen) {
      fetchCriteria();
    }
  }, [selectedClause, isViewCriteriaDialogOpen, fetchCriteria]);

  const handleAddClause = async (clauseData: CreateAuditClauseDTO) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await auditPolicyService.createClause(clauseData);
      toast.success('Clause created successfully');
      setIsAddClauseDialogOpen(false);
      fetchClauses();
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
      fetchClauses();
    } catch (error) {
      console.error('Failed to update clause:', error);
      toast.error('Failed to update clause');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClauseClick = (clause: AuditClause, event?: React.MouseEvent) => {
    event?.stopPropagation();
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
      fetchClauses();
    } catch (error) {
      console.error('Failed to delete clause:', error);
      toast.error('Failed to delete clause');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewClause = (clause: AuditClause) => {
    setSelectedClause(clause);
    setCriteriaPageIndex(0);
    setIsViewCriteriaDialogOpen(true);
  };

  const handleAddCriterion = async (criterionData: CreateAuditCriteriaDTO) => {
    if (!selectedClause) return;
    
    setIsSubmitting(true);
    try {
      await auditPolicyService.createCriterion(criterionData);
      toast.success('Criteria created successfully');
      setIsAddCriteriaDialogOpen(false);
      fetchCriteria();
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
      fetchCriteria();
    } catch (error) {
      console.error('Failed to update criteria:', error);
      toast.error('Failed to update criteria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCriterionClick = (criterion: AuditCriteria, event?: React.MouseEvent) => {
    event?.stopPropagation();
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
      fetchCriteria();
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
        title={`Audit Policy: ${element.name}`}
        subtitle={`Code: ${element.code} | Created on ${format(new Date(element.createdAt), 'dd MMM yyyy')}`}
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

      {/* Element Details */}
      <Card>
        <CardHeader>
          <CardTitle>Element Details</CardTitle>
          <CardDescription>Basic information about this audit policy element</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Code</label>
              <p className="mt-1 text-sm text-gray-900">{element.code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="mt-1 text-sm text-gray-900">{element.name}</p>
            </div>
            {element.description && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-sm text-gray-900">{element.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clauses Table */}
      <Card>
        <CardContent className="pt-6">
          <AuditClausesTable
            clauses={clauses}
            isLoading={isLoadingClauses}
            pageIndex={clausePageIndex}
            limit={clauseLimit}
            totalItems={totalClauses}
            onPageChange={setClausePageIndex}
            onPageSizeChange={setClauseLimit}
            onSearch={() => {}}
            onApplyFilters={() => {}}
            onAddClause={() => setIsAddClauseDialogOpen(true)}
            onViewClause={handleViewClause}
            onEditClause={handleEditClause}
            onDeleteClause={handleDeleteClauseClick}
            onDeleteConfirm={handleDeleteClauseConfirm}
            clauseToDelete={clauseToDelete}
            deleteDialogOpen={deleteClauseDialogOpen}
            onDeleteDialogChange={(open) => {
              if (!open) {
                setDeleteClauseDialogOpen(false);
                setClauseToDelete(null);
              }
            }}
          />
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

      {/* View Criteria Dialog */}
      <Dialog open={isViewCriteriaDialogOpen} onOpenChange={(open) => {
        setIsViewCriteriaDialogOpen(open);
        if (!open) {
          setSelectedClause(null);
          setCriteriaPageIndex(0);
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criteria: {selectedClause?.name}</DialogTitle>
            <DialogDescription>
              Manage criteria for clause {selectedClause?.code}
            </DialogDescription>
          </DialogHeader>
          {selectedClause && (
            <div className="space-y-4">
              <AuditCriteriaTable
                criteria={criteria}
                isLoading={isLoadingCriteria}
                pageIndex={criteriaPageIndex}
                limit={criteriaLimit}
                totalItems={totalCriteria}
                onPageChange={setCriteriaPageIndex}
                onPageSizeChange={setCriteriaLimit}
                onSearch={() => {}}
                onApplyFilters={() => {}}
                onAddCriterion={() => setIsAddCriteriaDialogOpen(true)}
                onEditCriterion={handleEditCriterion}
                onDeleteCriterion={handleDeleteCriterionClick}
                onDeleteConfirm={handleDeleteCriterionConfirm}
                criterionToDelete={criterionToDelete}
                deleteDialogOpen={deleteCriteriaDialogOpen}
                onDeleteDialogChange={(open) => {
                  if (!open) {
                    setDeleteCriteriaDialogOpen(false);
                    setCriterionToDelete(null);
                  }
                }}
                clauseCode={selectedClause.code}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Criteria Dialog */}
      <Dialog open={isAddCriteriaDialogOpen} onOpenChange={setIsAddCriteriaDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Criteria</DialogTitle>
            <DialogDescription>
              Add a new criteria to clause {selectedClause?.code}
            </DialogDescription>
          </DialogHeader>
          {selectedClause && (
            <AuditCriteriaForm
              auditClauseId={selectedClause.id}
              onSubmit={handleAddCriterion}
              onCancel={() => setIsAddCriteriaDialogOpen(false)}
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
    </div>
  );
};

export default AuditPolicyDetailPage;