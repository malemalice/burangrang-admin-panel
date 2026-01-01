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

import { InspectionItem } from '../types/inspection.types';
import { type CreateInspectionItemDTO } from '../types/inspection.types';
import inspectionsService from '../services/inspectionsService';
import InspectionItemForm from '../components/InspectionItemForm';
import { InspectionDetailsCard } from '../components/InspectionDetailsCard';
import { ApprovalTimelineCard } from '@/modules/risk-assessment/components/ApprovalTimelineCard';
import { ApprovalDialog } from '../components/ApprovalDialog';
import { ViewItemDialog } from '../components/ViewItemDialog';
import { InspectionItemsTable } from '../components/InspectionItemsTable';
import { useInspectionDetail } from '../hooks/useInspectionDetail';
import { getStatusBadge } from '../utils/inspectionBadgeHelpers';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { ApprovalStatus } from '@/core/lib/types';

const InspectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toPDF, targetRef } = usePDF({ filename: 'inspection.pdf' });
  
  const {
    inspection,
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
    refreshInspection,
  } = useInspectionDetail(id);

  // Dialog states
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalInitialStatus, setApprovalInitialStatus] = useState<ApprovalStatus>(ApprovalStatus.APPROVED);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isViewItemDialogOpen, setIsViewItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<InspectionItem | null>(null);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InspectionItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleSubmit = async () => {
    if (!id || !inspection) return;

    try {
      setIsUpdatingStatus(true);
      await inspectionsService.update(id, {
        status: GeneralStatusEnum.OPEN,
      });
      toast.success('Inspection submitted successfully');
      await refreshInspection();
    } catch (error) {
      console.error('Failed to submit inspection:', error);
      toast.error('Failed to submit inspection');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!id || !inspection) return;

    try {
      setIsUpdatingStatus(true);
      await inspectionsService.update(id, {
        status: GeneralStatusEnum.WAITING_APPROVAL,
      });
      toast.success('Approval requested successfully');
      await refreshInspection();
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

  const handleAddItemSubmit = async (itemData: CreateInspectionItemDTO) => {
    const success = await handleAddItem(itemData);
    if (success) {
      setIsAddItemDialogOpen(false);
    }
  };

  const handleEditItem = (item: InspectionItem) => {
    setEditingItem(item);
    setIsEditItemDialogOpen(true);
  };

  const handleUpdateItemSubmit = async (itemData: CreateInspectionItemDTO) => {
    if (!editingItem) return;
    const success = await handleUpdateItem(editingItem.id, itemData);
    if (success) {
      setIsEditItemDialogOpen(false);
      setEditingItem(null);
    }
  };

  const handleViewItem = (item: InspectionItem) => {
    setViewingItem(item);
    setIsViewItemDialogOpen(true);
  };

  const handleDeleteItemClick = (item: InspectionItem, event?: React.MouseEvent) => {
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
          <span>Loading inspection details...</span>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Inspection not found</h2>
        <p className="text-gray-600 mb-4">The inspection you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/inspections')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inspections
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Inspection: ${inspection.code}`}
        subtitle={`Created on ${format(new Date(inspection.createdAt), 'dd MMM yyyy')}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            {/* Status-based action buttons */}
            {(inspection.status === GeneralStatusEnum.SCHEDULED || 
            inspection.status === GeneralStatusEnum.REJECTED ||
              inspection.status === GeneralStatusEnum.DRAFT) && (
              <Button 
                variant="default"
                onClick={handleSubmit}
                disabled={isUpdatingStatus}
              >
                <Send className="h-4 w-4 mr-2" />
                {isUpdatingStatus ? 'Submitting...' : 'Submit'}
              </Button>
            )}

            {inspection.status === GeneralStatusEnum.OPEN && (
              <Button 
                variant="default"
                onClick={handleRequestApproval}
                disabled={isUpdatingStatus}
              >
                <Send className="h-4 w-4 mr-2" />
                {isUpdatingStatus ? 'Requesting...' : 'Request Approval'}
              </Button>
            )}

            {inspection.status === GeneralStatusEnum.WAITING_APPROVAL && canApprove && (
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
            
            {inspection.status !== GeneralStatusEnum.DONE && 
             inspection.status !== GeneralStatusEnum.REJECTED &&
             inspection.status !== GeneralStatusEnum.WAITING_APPROVAL && (
              <Button 
                variant="outline"
                onClick={() => navigate(`/inspections/${id}/edit`)}
              >
                <FileEdit className="h-4 w-4 mr-2" />
                Edit Inspection
              </Button>
            )}
          </div>
        }
      >
        <div className="flex items-center gap-3">
          {getStatusBadge(inspection.status)}
        </div>
      </PageHeader>

      {/* Inspection Details & Approval Timeline Card - Side by Side */}
      <div ref={targetRef}>
        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
            <CardDescription>Basic information and approval progress of this inspection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:auto-rows-fr">
              <InspectionDetailsCard inspection={inspection} />
              <ApprovalTimelineCard 
                approvalHistory={approvalHistory} 
                isLoading={isLoadingHistory}
                assessmentStatus={inspection?.status}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inspection Items Section */}
      <InspectionItemsTable
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
        hideActions={inspection.status === GeneralStatusEnum.WAITING_APPROVAL || inspection.status === GeneralStatusEnum.DONE}
      />

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Inspection Item</DialogTitle>
            <DialogDescription>
              Add a new inspection item to this inspection.
            </DialogDescription>
          </DialogHeader>
          <InspectionItemForm
            inspectionId={id}
            onSubmit={handleAddItemSubmit}
            onCancel={() => setIsAddItemDialogOpen(false)}
            showCard={false}
            inspectionStatus={inspection?.status}
            canApprove={canApprove}
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
            <DialogTitle>Edit Inspection Item</DialogTitle>
            <DialogDescription>
              Update the inspection item details.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <InspectionItemForm
              inspectionId={id}
              initialItem={{
                riskCategoryId: editingItem.riskCategoryId,
                riskId: editingItem.riskId,
                assignedDepartmentId: editingItem.assignedDepartmentId,
                assigneeId: editingItem.assigneeId,
                description: editingItem.description,
                followUpNotes: editingItem.followUpNotes,
                images: editingItem.images?.map(img => ({
                  imageUrl: img.imageUrl,
                  caption: img.caption,
                  order: img.order,
                })),
              }}
              onSubmit={handleUpdateItemSubmit}
              onCancel={() => {
                setIsEditItemDialogOpen(false);
                setEditingItem(null);
              }}
              showCard={false}
              inspectionStatus={inspection?.status}
              canApprove={canApprove}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      {id && (
        <ApprovalDialog
          open={isApprovalModalOpen}
          onOpenChange={setIsApprovalModalOpen}
          inspectionId={id}
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

export default InspectionDetailPage;

