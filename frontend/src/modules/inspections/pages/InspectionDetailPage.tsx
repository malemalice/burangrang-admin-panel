import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FileEdit, ArrowLeft, FileDown, Send } from 'lucide-react';
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
import { ViewItemDialog } from '../components/ViewItemDialog';
import { InspectionItemsTable } from '../components/InspectionItemsTable';
import { useInspectionDetail } from '../hooks/useInspectionDetail';
import { getStatusBadge } from '../utils/inspectionBadgeHelpers';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

const InspectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toPDF, targetRef } = usePDF({ filename: 'inspection.pdf' });
  
  const {
    inspection,
    items,
    isLoading,
    isLoadingItems,
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
    refreshInspection,
  } = useInspectionDetail(id);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isViewItemDialogOpen, setIsViewItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [editingFormMode, setEditingFormMode] = useState<'creator' | 'updater' | 'verifier' | null>(null);
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
    setEditingFormMode(null);
    setIsEditItemDialogOpen(true);
  };

  const handleEditItemAsCreator = (item: InspectionItem) => {
    setEditingItem(item);
    setEditingFormMode('creator');
    setIsEditItemDialogOpen(true);
  };

  const handleEditItemAsUpdater = (item: InspectionItem) => {
    setEditingItem(item);
    setEditingFormMode('updater');
    setIsEditItemDialogOpen(true);
  };

  const handleEditItemAsVerifier = (item: InspectionItem) => {
    setEditingItem(item);
    setEditingFormMode('verifier');
    setIsEditItemDialogOpen(true);
  };

  const handleUpdateItemSubmit = async (itemData: CreateInspectionItemDTO) => {
    if (!editingItem) return;
    const success = await handleUpdateItem(editingItem.id, itemData);
    if (success) {
      setIsEditItemDialogOpen(false);
      setEditingItem(null);
      setEditingFormMode(null);
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

            {/* Standard action buttons */}
            <Button 
              variant="outline"
              onClick={handleExportPDF}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            
            {inspection.status !== GeneralStatusEnum.DONE && 
             inspection.status !== GeneralStatusEnum.REJECTED && (
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

      {/* Inspection Details Card */}
      <div ref={targetRef}>
        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
            <CardDescription>Basic information of this inspection</CardDescription>
          </CardHeader>
          <CardContent>
            <InspectionDetailsCard inspection={inspection} />
          </CardContent>
        </Card>
      </div>

      {/* Inspection Items Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inspection Items</CardTitle>
              <CardDescription>Manage inspection items by status</CardDescription>
            </div>
            {inspection.status !== GeneralStatusEnum.DONE && (
              <Button onClick={() => setIsAddItemDialogOpen(true)}>
                Add Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Total Items Summary */}
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold mb-2">Total Items</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="text-2xl font-bold">{totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Open:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {items.filter(item => item.status === GeneralStatusEnum.OPEN).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Closed:</span>
                    <span className="text-lg font-semibold text-green-600">
                      {items.filter(item => item.status === GeneralStatusEnum.DONE).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Items by Status */}
            <div className="space-y-6">
              {/* Open Items Row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Open Items ({items.filter(item => item.status === GeneralStatusEnum.OPEN).length})
                  </h3>
                </div>
                <InspectionItemsTable
                  items={items.filter(item => item.status === GeneralStatusEnum.OPEN)}
                  isLoading={isLoadingItems}
                  pageIndex={0}
                  limit={1000}
                  totalItems={items.filter(item => item.status === GeneralStatusEnum.OPEN).length}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                  onSearch={() => {}}
                  onApplyFilters={() => {}}
                  onAddItem={() => setIsAddItemDialogOpen(true)}
                  onViewItem={handleViewItem}
                  onEditItem={handleEditItem}
                  onEditItemAsCreator={handleEditItemAsCreator}
                  onEditItemAsUpdater={handleEditItemAsUpdater}
                  onEditItemAsVerifier={handleEditItemAsVerifier}
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
                  hideActions={inspection.status === GeneralStatusEnum.DONE}
                  hideHeader={true}
                  hidePagination={true}
                />
              </div>

              {/* Closed Items Row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Closed Items ({items.filter(item => item.status === GeneralStatusEnum.DONE).length})
                  </h3>
                </div>
                <InspectionItemsTable
                  items={items.filter(item => item.status === GeneralStatusEnum.DONE)}
                  isLoading={isLoadingItems}
                  pageIndex={0}
                  limit={1000}
                  totalItems={items.filter(item => item.status === GeneralStatusEnum.DONE).length}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                  onSearch={() => {}}
                  onApplyFilters={() => {}}
                  onAddItem={() => setIsAddItemDialogOpen(true)}
                  onViewItem={handleViewItem}
                  onEditItem={handleEditItem}
                  onEditItemAsCreator={handleEditItemAsCreator}
                  onEditItemAsUpdater={handleEditItemAsUpdater}
                  onEditItemAsVerifier={handleEditItemAsVerifier}
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
                  hideActions={inspection.status === GeneralStatusEnum.DONE}
                  hideHeader={true}
                  hidePagination={true}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
          />
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={(open) => {
        setIsEditItemDialogOpen(open);
        if (!open) {
          setEditingItem(null);
          setEditingFormMode(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFormMode === 'creator' && 'Edit as Creator'}
              {editingFormMode === 'updater' && 'Update Action Item'}
              {editingFormMode === 'verifier' && 'Verify Inspection Item'}
              {!editingFormMode && 'Edit Inspection Item'}
            </DialogTitle>
            <DialogDescription>
              {editingFormMode === 'creator' && 'Edit inspection item details (Area, Risk, Findings, Description, Due Date, Risk Mitigation)'}
              {editingFormMode === 'updater' && 'Update action item progress (After Images, Follow-up Notes)'}
              {editingFormMode === 'verifier' && 'Verify and adjust all inspection item fields'}
              {!editingFormMode && 'Update the inspection item details.'}
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <InspectionItemForm
              inspectionId={id}
              initialItem={{
                areaId: editingItem.areaId,
                status: editingItem.status,
                riskCategoryId: editingItem.riskCategoryId,
                riskId: editingItem.riskId,
                assignedDepartmentId: editingItem.assignedDepartmentId,
                assigneeId: editingItem.assigneeId,
                description: editingItem.description,
                followUpNotes: editingItem.followUpNotes,
                findings: editingItem.findings,
                dueDateAt: editingItem.dueDateAt ? new Date(editingItem.dueDateAt).toISOString().split('T')[0] : undefined,
                images: editingItem.images?.map(img => ({
                  imageUrl: img.imageUrl,
                  caption: img.caption,
                  order: img.order,
                })),
                mitigation: editingItem.mitigation ? {
                  eliminate: editingItem.mitigation.eliminate,
                  transfer: editingItem.mitigation.transfer,
                  reduce: editingItem.mitigation.reduce,
                  accept: editingItem.mitigation.accept,
                  legalAspect: editingItem.mitigation.legalAspect,
                } : undefined,
              }}
              onSubmit={handleUpdateItemSubmit}
              onCancel={() => {
                setIsEditItemDialogOpen(false);
                setEditingItem(null);
                setEditingFormMode(null);
              }}
              showCard={false}
              inspectionStatus={inspection?.status}
              formMode={editingFormMode || 'creator'}
            />
          )}
        </DialogContent>
      </Dialog>

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

