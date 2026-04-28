import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FileEdit, ArrowLeft, FileDown, Send } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import { toast } from 'sonner';

import { useAuth } from '@/core/lib/auth';
import api from '@/core/lib/api';
import { buildPdfOptions, generateTableAwarePdf } from '@/core/lib/pdfExport';
import { ROLE_CODES } from '@/shared/constants/role-codes.constants';
import roleService from '@/modules/roles/services/roleService';
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
import inspectionItemsService from '../inspection-items/services/inspectionItemsService';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { InspectionDetailsCard } from '../components/InspectionDetailsCard';
import { InspectionPDFTemplate } from '../components/InspectionPDFTemplate';
import { ViewItemDialog } from '../components/ViewItemDialog';
import { InspectionItemsTable } from '../components/InspectionItemsTable';
import { useInspectionDetail } from '../hooks/useInspectionDetail';
import { getStatusBadge } from '../utils/inspectionBadgeHelpers';

const InspectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [allItemsForPDF, setAllItemsForPDF] = useState<InspectionItem[]>([]);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState(false);

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

  const baseFilename = useMemo(() => {
    return inspection?.code ?? 'inspection';
  }, [inspection]);

  const { targetRef } = usePDF(
    buildPdfOptions({
      filename: `${baseFilename}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
    }),
  );

  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isViewItemDialogOpen, setIsViewItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [editingFormMode, setEditingFormMode] = useState<'creator' | 'updater' | 'verifier' | null>(null);
  const [viewingItem, setViewingItem] = useState<InspectionItem | null>(null);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InspectionItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [approvalRights, setApprovalRights] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await api.get('/users/me');
        const userData = response.data;
        let roleCode: string | null = null;
        if (userData.role && typeof userData.role === 'object' && 'code' in userData.role) {
          roleCode = userData.role.code;
        }
        if (!roleCode && userData.roleId) {
          const role = await roleService.getRoleById(userData.roleId);
          roleCode = role.code;
        }
        setIsSuperUser(roleCode === ROLE_CODES.SUPER_ADMIN);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      }
    };
    fetchUserRole();
  }, [currentUser?.id]);

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
    if (!id || !inspection) return;

    try {
      setIsLoadingAllItems(true);

      const itemsResponse = await inspectionsService.getItems(id, {
        page: 1,
        limit: 10000,
      });

      setAllItemsForPDF(itemsResponse.data);

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

  const handleEditItemAsVerifier = async (item: InspectionItem) => {
    // Check approval rights before allowing verifier mode
    try {
      const rights = await inspectionItemsService.checkApprovalRights(item.id);
      if (!rights.canApprove) {
        toast.error('You do not have approval rights for this inspection item');
        return;
      }
      setEditingItem(item);
      setEditingFormMode('verifier');
      setIsEditItemDialogOpen(true);
    } catch (error) {
      console.error('Failed to check approval rights:', error);
      toast.error('Failed to check approval rights');
    }
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

  // Check approval rights for items with WAITING_APPROVAL status
  useEffect(() => {
    const checkApprovalRights = async () => {
      const waitingApprovalItems = items.filter(item => item.status === GeneralStatusEnum.WAITING_APPROVAL);
      if (waitingApprovalItems.length === 0) {
        setApprovalRights({});
        return;
      }

      const rightsMap: Record<string, boolean> = {};
      await Promise.all(
        waitingApprovalItems.map(async (item) => {
          try {
            const rights = await inspectionItemsService.checkApprovalRights(item.id);
            rightsMap[item.id] = rights.canApprove || false;
          } catch (error) {
            console.error(`Failed to check approval rights for item ${item.id}:`, error);
            rightsMap[item.id] = false;
          }
        })
      );
      
      setApprovalRights(prev => ({ ...prev, ...rightsMap }));
    };

    if (items.length > 0) {
      checkApprovalRights();
    }
  }, [items]);

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
              disabled={isLoadingAllItems}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {isLoadingAllItems ? 'Preparing PDF...' : 'Export PDF'}
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

      {/* PDF Template - Hidden from screen, only used for PDF export */}
      {inspection && (
        <div
          ref={targetRef}
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
          aria-hidden="true"
        >
          <InspectionPDFTemplate
            inspection={inspection}
            items={allItemsForPDF.length > 0 ? allItemsForPDF : items}
          />
        </div>
      )}

      {/* Inspection Details & Items Summary Card - Side by Side */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Details</CardTitle>
          <CardDescription>Basic information and summary of this inspection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:auto-rows-fr">
            <InspectionDetailsCard inspection={inspection} />
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Items Summary</h3>
              </div>
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
                      {items.filter(item => item.status === 'OPEN').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Close:</span>
                    <span className="text-lg font-semibold text-green-600">
                      {items.filter(item => item.status === 'CLOSE').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Items Section */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Inspection Items</h2>
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
          approvalRights={approvalRights}
          isSuperUser={isSuperUser}
        />
      </div>

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
                id: editingItem.id, // Include id for approval rights check in verifier mode
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
                  type: img.type,
                })),
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

