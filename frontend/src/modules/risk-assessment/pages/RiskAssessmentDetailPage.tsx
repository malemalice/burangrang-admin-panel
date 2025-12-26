import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FileEdit, ArrowLeft, FileDown, CheckCircle2, Send, XCircle } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
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

import { RiskAssessmentItem } from '@/core/lib/types';
import { type CreateRiskAssessmentItemDTO } from '../services/riskAssessmentService';
import riskAssessmentService from '../services/riskAssessmentService';
import RiskAssessmentItemForm from '../components/RiskAssessmentItemForm';
import { AssessmentDetailsCard } from '../components/AssessmentDetailsCard';
import { ApprovalTimelineCard } from '../components/ApprovalTimelineCard';
import { ApprovalDialog } from '../components/ApprovalDialog';
import { ViewItemDialog } from '../components/ViewItemDialog';
import { RiskAssessmentItemsTable } from '../components/RiskAssessmentItemsTable';
import { useRiskAssessmentDetail } from '../hooks/useRiskAssessmentDetail';
import { getStatusBadge } from '../utils/riskBadgeHelpers';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { ApprovalStatus } from '@/core/lib/types';

const RiskAssessmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toPDF, targetRef } = usePDF({ filename: 'risk-assessment.pdf' });
  
  const {
    assessment,
    items,
    isLoading,
    isLoadingItems,
    isLoadingHistory,
    canApprove,
    approvalHistory,
    pageIndex,
    limit,
    totalItems,
    setPageIndex,
    setLimit,
    handleSearch,
    handleApplyFilters,
    handleAddItem,
    handleUpdateItem,
    handleDeleteItem,
    handleApprovalSubmitted,
    refreshAssessment,
  } = useRiskAssessmentDetail(id);

  // Dialog states
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalInitialStatus, setApprovalInitialStatus] = useState<ApprovalStatus>(ApprovalStatus.APPROVED);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isViewItemDialogOpen, setIsViewItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<RiskAssessmentItem | null>(null);
  const [editingItem, setEditingItem] = useState<RiskAssessmentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RiskAssessmentItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleSubmit = async () => {
    if (!id || !assessment) return;

    try {
      setIsUpdatingStatus(true);
      await riskAssessmentService.update(id, {
        status: GeneralStatusEnum.OPEN,
      });
      toast.success('Risk assessment submitted successfully');
      await refreshAssessment();
    } catch (error) {
      console.error('Failed to submit risk assessment:', error);
      toast.error('Failed to submit risk assessment');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!id || !assessment) return;

    try {
      setIsUpdatingStatus(true);
      await riskAssessmentService.update(id, {
        status: GeneralStatusEnum.WAITING_APPROVAL,
      });
      toast.success('Approval requested successfully');
      await refreshAssessment();
    } catch (error) {
      console.error('Failed to request approval:', error);
      toast.error('Failed to request approval');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await toPDF();
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleAddItemSubmit = async (itemData: CreateRiskAssessmentItemDTO) => {
    const success = await handleAddItem(itemData);
    if (success) {
      setIsAddItemDialogOpen(false);
    }
  };

  const handleEditItem = (item: RiskAssessmentItem) => {
    setEditingItem(item);
    setIsEditItemDialogOpen(true);
  };

  const handleUpdateItemSubmit = async (itemData: CreateRiskAssessmentItemDTO) => {
    if (!editingItem) return;
    const success = await handleUpdateItem(editingItem.id, itemData);
    if (success) {
      setIsEditItemDialogOpen(false);
      setEditingItem(null);
    }
  };

  const handleViewItem = (item: RiskAssessmentItem) => {
    setViewingItem(item);
    setIsViewItemDialogOpen(true);
  };

  const handleDeleteItemClick = (item: RiskAssessmentItem, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteItemConfirm = async () => {
    if (!itemToDelete) return;
    const success = await handleDeleteItem(itemToDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <span>Loading risk assessment details...</span>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Risk Assessment not found</h2>
        <p className="text-gray-600 mb-4">The risk assessment you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/risk-assessment')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Assessments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Risk Assessment: ${assessment.code}`}
        subtitle={`Created on ${format(new Date(assessment.createdAt), 'dd MMM yyyy')}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            {/* Status-based action buttons */}
            {(assessment.status === GeneralStatusEnum.SCHEDULED || 
              assessment.status === GeneralStatusEnum.DRAFT) && (
              <Button 
                variant="default"
                onClick={handleSubmit}
                disabled={isUpdatingStatus}
              >
                <Send className="h-4 w-4 mr-2" />
                {isUpdatingStatus ? 'Submitting...' : 'Submit'}
              </Button>
            )}

            {assessment.status === GeneralStatusEnum.OPEN && (
              <Button 
                variant="default"
                onClick={handleRequestApproval}
                disabled={isUpdatingStatus}
              >
                <Send className="h-4 w-4 mr-2" />
                {isUpdatingStatus ? 'Requesting...' : 'Request Approval'}
              </Button>
            )}

            {assessment.status === GeneralStatusEnum.WAITING_APPROVAL && canApprove && (
              <>
                <Button 
                  variant="default"
                  onClick={() => {
                    setApprovalInitialStatus(ApprovalStatus.APPROVED);
                    setIsApprovalModalOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setApprovalInitialStatus(ApprovalStatus.REJECTED);
                    setIsApprovalModalOpen(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}

            {/* Standard action buttons */}
            <Button 
              variant="outline"
              onClick={handleExportPDF}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            
            {assessment.status !== GeneralStatusEnum.DONE && 
             assessment.status !== GeneralStatusEnum.REJECTED &&
             assessment.status !== GeneralStatusEnum.WAITING_APPROVAL && (
              <Button 
                variant="outline"
                onClick={() => navigate(`/risk-assessment/${id}/edit`)}
              >
                <FileEdit className="h-4 w-4 mr-2" />
                Edit Assessment
              </Button>
            )}
          </div>
        }
      >
        <div className="flex items-center gap-3">
          {getStatusBadge(assessment.status)}
        </div>
      </PageHeader>

      {/* Risk Assessment Details & Approval Timeline Card - Side by Side */}
      <div ref={targetRef}>
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>Basic information and approval progress of this risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AssessmentDetailsCard assessment={assessment} />
              <ApprovalTimelineCard approvalHistory={approvalHistory} isLoading={isLoadingHistory} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment Items Section */}
      <RiskAssessmentItemsTable
        items={items}
        isLoading={isLoadingItems}
        pageIndex={pageIndex}
        limit={limit}
        totalItems={totalItems}
        onPageChange={setPageIndex}
        onPageSizeChange={setLimit}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        onAddItem={() => setIsAddItemDialogOpen(true)}
        onViewItem={handleViewItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItemClick}
        onDeleteConfirm={handleDeleteItemConfirm}
        itemToDelete={itemToDelete}
        deleteDialogOpen={deleteDialogOpen}
        onDeleteDialogChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          }
        }}
        hideActions={assessment.status === GeneralStatusEnum.WAITING_APPROVAL || assessment.status === GeneralStatusEnum.DONE}
      />


      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Risk Assessment Item</DialogTitle>
            <DialogDescription>
              Add a new risk assessment item to this assessment.
            </DialogDescription>
          </DialogHeader>
          <RiskAssessmentItemForm
            assessmentId={id}
            onSubmit={handleAddItemSubmit}
            onCancel={() => setIsAddItemDialogOpen(false)}
            showCard={false}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={(open) => {
        setIsEditItemDialogOpen(open);
        if (!open) {
          setEditingItem(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Risk Assessment Item</DialogTitle>
            <DialogDescription>
              Update the risk assessment item details.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <RiskAssessmentItemForm
              assessmentId={id}
              initialItem={{
                mRiskId: editingItem.mRiskId,
                mRiskCategoryId: editingItem.mRiskCategoryId,
                likelihoodLevel: editingItem.likelihoodLevel,
                consequenceLevel: editingItem.consequenceLevel,
                riskMatrixRating: editingItem.riskMatrixRating,
                interpretation: editingItem.interpretation,
                postLikelihoodLevel: editingItem.postLikelihoodLevel,
                postConsequenceLevel: editingItem.postConsequenceLevel,
                postRiskMatrixRating: editingItem.postRiskMatrixRating,
                postInterpretation: editingItem.postInterpretation,
              }}
              onSubmit={handleUpdateItemSubmit}
              onCancel={() => {
                setIsEditItemDialogOpen(false);
                setEditingItem(null);
              }}
              showCard={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      {id && (
        <ApprovalDialog
          open={isApprovalModalOpen}
          onOpenChange={setIsApprovalModalOpen}
          assessmentId={id}
          onApprovalSubmitted={handleApprovalSubmitted}
          initialStatus={approvalInitialStatus}
        />
      )}

      {/* View Item Dialog */}
      <ViewItemDialog
        open={isViewItemDialogOpen}
        onOpenChange={setIsViewItemDialogOpen}
        item={viewingItem}
      />
    </div>
  );
};

export default RiskAssessmentDetailPage;
