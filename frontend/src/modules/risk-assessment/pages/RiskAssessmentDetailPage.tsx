import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FileEdit, ArrowLeft, FileDown, CheckCircle2, Send, XCircle } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import { toast } from 'sonner';

import api from '@/core/lib/api';
import { buildPdfOptions, generateTableAwarePdf } from '@/core/lib/pdfExport';
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
import { approvalService, type ApprovalStatusHistory } from '@/modules/master-data';
import RiskAssessmentItemForm from '../components/RiskAssessmentItemForm';
import { AssessmentDetailsCard } from '../components/AssessmentDetailsCard';
import { ApprovalTimelineCard } from '../components/ApprovalTimelineCard';
import { ApprovalDialog } from '../components/ApprovalDialog';
import { ViewItemDialog } from '../components/ViewItemDialog';
import { RiskAssessmentItemsTable } from '../components/RiskAssessmentItemsTable';
import { RiskAssessmentPDFTemplate } from '../components/RiskAssessmentPDFTemplate';
import { useRiskAssessmentDetail } from '../hooks/useRiskAssessmentDetail';
import { getStatusBadge } from '../utils/riskBadgeHelpers';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { ApprovalStatus } from '@/core/lib/types';

const RiskAssessmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [allItemsForPDF, setAllItemsForPDF] = useState<RiskAssessmentItem[]>([]);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState(false);
  const [approvalHistoryForPDF, setApprovalHistoryForPDF] = useState<ApprovalStatusHistory | null>(null);
  
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

  // Generate base filename - will use code with timestamp generated at export time
  const baseFilename = useMemo(() => {
    if (!assessment) return 'risk-assessment';
    return assessment.code;
  }, [assessment]);

  // Initialize with a placeholder - we'll generate the actual filename at export time
  const { targetRef } = usePDF(
    buildPdfOptions({
      filename: `${baseFilename}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
    }),
  );

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
  const [isUpdateActionItemDialogOpen, setIsUpdateActionItemDialogOpen] = useState(false);
  const [itemToUpdateAction, setItemToUpdateAction] = useState<RiskAssessmentItem | null>(null);
  const [userDepartmentId, setUserDepartmentId] = useState<string | null>(null);
  const [userDepartmentCode, setUserDepartmentCode] = useState<string | null>(null);

  // Fetch current user profile for Update Action Item visibility
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/users/me');
        const userData = response.data;
        if (userData?.departmentId) {
          setUserDepartmentId(userData.departmentId);
          if (userData.department?.code) {
            setUserDepartmentCode(userData.department.code);
          }
        }
      } catch {
        // User may not have department; leave null
      }
    };
    fetchUser();
  }, []);

  const canUpdateActionItem = useMemo(() => {
    if (!assessment) return false;
    const statusWaitingApproval = assessment.status === GeneralStatusEnum.WAITING_APPROVAL;
    const userMatchesApprovalLine =
      approvalHistory?.nextApprover?.department?.id != null &&
      userDepartmentId != null &&
      approvalHistory.nextApprover.department.id === userDepartmentId;
    const userDeptIsHse =
      userDepartmentCode != null && userDepartmentCode.toUpperCase() === 'HSE';
    return statusWaitingApproval || userMatchesApprovalLine || userDeptIsHse;
  }, [assessment, approvalHistory?.nextApprover?.department?.id, userDepartmentId, userDepartmentCode]);

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
    if (!id || !assessment) return;

    try {
      setIsLoadingAllItems(true);
      
      const [itemsResponse, approvalStatus] = await Promise.all([
        // Fetch all items (not paginated) for PDF
        riskAssessmentService.getItems(id, {
          page: 1,
          limit: 10000, // Large limit to get all items
        }),
        // Ensure approval history is available for the PDF
        approvalService.checkApprovalStatus(id).catch(() => null),
      ]);
      
      setAllItemsForPDF(itemsResponse.data);

      if (approvalStatus && !(typeof approvalStatus === 'object' && 'error' in approvalStatus && approvalStatus.error)) {
        setApprovalHistoryForPDF(approvalStatus as ApprovalStatusHistory);
      } else {
        // Fall back to whatever the page already has
        setApprovalHistoryForPDF(approvalHistory);
      }
      
      // Wait for React to re-render with new data
      await new Promise((resolve) => setTimeout(resolve, 200));

      await generateTableAwarePdf(
        targetRef,
        buildPdfOptions({
          filename: `${baseFilename}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
        }),
      );
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsLoadingAllItems(false);
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

  const handleUpdateActionItem = (item: RiskAssessmentItem) => {
    setItemToUpdateAction(item);
    setIsUpdateActionItemDialogOpen(true);
  };

  const handleUpdateActionItemSubmit = async (itemData: CreateRiskAssessmentItemDTO) => {
    if (!itemToUpdateAction) return;
    const success = await handleUpdateItem(itemToUpdateAction.id, itemData);
    if (success) {
      setIsUpdateActionItemDialogOpen(false);
      setItemToUpdateAction(null);
    }
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
            assessment.status === GeneralStatusEnum.REJECTED ||
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
              disabled={isLoadingAllItems}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {isLoadingAllItems ? 'Preparing PDF...' : 'Export PDF'}
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

      {/* PDF Template - Hidden from screen, only used for PDF export */}
      {assessment && (
        <div 
          ref={targetRef} 
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
          aria-hidden="true"
        >
          <RiskAssessmentPDFTemplate
            assessment={assessment}
            items={allItemsForPDF.length > 0 ? allItemsForPDF : items}
            approvalHistory={approvalHistoryForPDF ?? approvalHistory}
          />
        </div>
      )}

      {/* Risk Assessment Details & Approval Timeline Card - Side by Side */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
          <CardDescription>Basic information and approval progress of this risk assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:auto-rows-fr">
            <AssessmentDetailsCard assessment={assessment} />
            <ApprovalTimelineCard 
              approvalHistory={approvalHistory} 
              isLoading={isLoadingHistory}
              assessmentStatus={assessment?.status}
              entityDepartmentName={assessment?.department?.name}
              entityJobPositionName="Department Head"
            />
          </div>
        </CardContent>
      </Card>

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
        onUpdateActionItem={handleUpdateActionItem}
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
        canUpdateActionItem={canUpdateActionItem}
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
            mode="creator"
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
              mode="creator"
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
                mitigation: editingItem.mitigation ? {
                  eliminate: editingItem.mitigation.eliminate,
                  eliminationControl: (editingItem.mitigation as any).eliminationControl,
                  substitutionControl: (editingItem.mitigation as any).substitutionControl,
                  engineeringControl: (editingItem.mitigation as any).engineeringControl,
                  administrationControl: (editingItem.mitigation as any).administrationControl,
                  personalProtectiveEquipment: (editingItem.mitigation as any).personalProtectiveEquipment,
                  transfer: editingItem.mitigation.transfer,
                  accept: editingItem.mitigation.accept,
                  legalAspect: editingItem.mitigation.legalAspect,
                } : undefined,
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

      {/* Update Action Item Dialog - updater mode: Post-Control & Legal Aspect only */}
      <Dialog
        open={isUpdateActionItemDialogOpen}
        onOpenChange={(open) => {
          setIsUpdateActionItemDialogOpen(open);
          if (!open) setItemToUpdateAction(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Action Item</DialogTitle>
            <DialogDescription>
              Update Post-Control Assessment and Legal Aspect for this item (approver/updater mode).
            </DialogDescription>
          </DialogHeader>
          {itemToUpdateAction && (
            <RiskAssessmentItemForm
              assessmentId={id}
              mode="updater"
              initialItem={{
                mRiskId: itemToUpdateAction.mRiskId,
                mRiskCategoryId: itemToUpdateAction.mRiskCategoryId,
                likelihoodLevel: itemToUpdateAction.likelihoodLevel,
                consequenceLevel: itemToUpdateAction.consequenceLevel,
                riskMatrixRating: itemToUpdateAction.riskMatrixRating,
                interpretation: itemToUpdateAction.interpretation,
                postLikelihoodLevel: itemToUpdateAction.postLikelihoodLevel,
                postConsequenceLevel: itemToUpdateAction.postConsequenceLevel,
                postRiskMatrixRating: itemToUpdateAction.postRiskMatrixRating,
                postInterpretation: itemToUpdateAction.postInterpretation,
                mitigation: itemToUpdateAction.mitigation ? {
                  eliminate: itemToUpdateAction.mitigation.eliminate,
                  eliminationControl: (itemToUpdateAction.mitigation as any).eliminationControl,
                  substitutionControl: (itemToUpdateAction.mitigation as any).substitutionControl,
                  engineeringControl: (itemToUpdateAction.mitigation as any).engineeringControl,
                  administrationControl: (itemToUpdateAction.mitigation as any).administrationControl,
                  personalProtectiveEquipment: (itemToUpdateAction.mitigation as any).personalProtectiveEquipment,
                  transfer: itemToUpdateAction.mitigation.transfer,
                  accept: itemToUpdateAction.mitigation.accept,
                  legalAspect: itemToUpdateAction.mitigation.legalAspect,
                } : undefined,
              }}
              onSubmit={handleUpdateActionItemSubmit}
              onCancel={() => {
                setIsUpdateActionItemDialogOpen(false);
                setItemToUpdateAction(null);
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
