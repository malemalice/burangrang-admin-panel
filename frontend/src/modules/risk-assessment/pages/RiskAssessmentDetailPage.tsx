import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileEdit, ArrowLeft, CheckCircle2, XCircle, Clock, FileDown, Plus, MoreHorizontal, Trash2, Eye } from 'lucide-react';
import { usePDF } from 'react-to-pdf';

import { Button, ThemeButton } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import PageHeader from '@/core/components/ui/PageHeader';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Label } from '@/core/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Textarea } from '@/core/components/ui/textarea';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';

import { RiskAssessment, RiskAssessmentItem, ApprovalStatus } from '@/core/lib/types';
import riskAssessmentService, { type CreateRiskAssessmentItemDTO } from '../services/riskAssessmentService';
import { approvalService, type ApprovalStatusHistory } from '@/modules/master-data';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import RiskAssessmentItemForm from '../components/RiskAssessmentItemForm';

const RiskAssessmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toPDF, targetRef } = usePDF({ filename: 'risk-assessment.pdf' });
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [items, setItems] = useState<RiskAssessmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(ApprovalStatus.APPROVED);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalStatusHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  // Items table state
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RiskAssessmentItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Add Item Dialog
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);

  // Fetch assessment details
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const [assessmentData, approvalRights, approvalStatus] = await Promise.all([
          riskAssessmentService.getById(id),
          approvalService.checkApprovalRights(id),
          approvalService.checkApprovalStatus(id),
        ]);
        setAssessment(assessmentData);
        setCanApprove(approvalRights.canApprove);
        setApprovalHistory(approvalStatus);
      } catch (error) {
        toast.error('Failed to fetch risk assessment');
        navigate('/risk-assessment');
      } finally {
        setIsLoading(false);
        setIsLoadingHistory(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Fetch items with pagination
  const fetchItems = useCallback(async () => {
    if (!id) return;
    
    setIsLoadingItems(true);
    try {
      const params: any = {
        page: pageIndex + 1,
        limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      Object.entries(activeFilters).forEach(([key, filter]) => {
        params[key] = filter.value;
      });

      const response = await riskAssessmentService.getItems(id, params);
      setItems(response.data);
      setTotalItems(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('Failed to load risk assessment items');
    } finally {
      setIsLoadingItems(false);
    }
  }, [id, pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSubmitApproval = async () => {
    if (!id) return;

    try {
      setIsSubmitting(true);
      await approvalService.submitApproval({
        dataId: id,
        entity: 'RiskAssessment',
        status: approvalStatus,
        notes: approvalNotes,
      });

      toast.success('Approval submitted successfully');
      setIsApprovalModalOpen(false);
      // Refresh assessment data
      const assessmentData = await riskAssessmentService.getById(id);
      setAssessment(assessmentData);
    } catch (error) {
      toast.error('Failed to submit approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await toPDF();
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handleAddItem = async (itemsData: CreateRiskAssessmentItemDTO[]) => {
    if (!id || !itemsData || itemsData.length === 0) return;

    try {
      // Create items one by one (or batch if backend supports it)
      for (const itemData of itemsData) {
        await riskAssessmentService.createItem(id, itemData);
      }
      toast.success('Risk assessment item(s) created successfully');
      setIsAddItemDialogOpen(false);
      fetchItems();
      // Refresh assessment to update item count
      const assessmentData = await riskAssessmentService.getById(id);
      setAssessment(assessmentData);
    } catch (error) {
      console.error('Failed to create item:', error);
      toast.error('Failed to create risk assessment item');
    }
  };

  const handleDeleteItem = async (item: RiskAssessmentItem, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteItemConfirm = async () => {
    if (!id || !itemToDelete) return;

    try {
      await riskAssessmentService.deleteItem(id, itemToDelete.id);
      toast.success('Risk assessment item deleted successfully');
      setOpenDropdownId(null);
      fetchItems();
      // Refresh assessment to update item count
      const assessmentData = await riskAssessmentService.getById(id);
      setAssessment(assessmentData);
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete risk assessment item');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      newActiveFilters[filter.id] = {
        value: filter.value,
        label: String(filter.value)
      };
    });
    
    setActiveFilters(newActiveFilters);
    setPageIndex(0);
  };

  // Get risk badge color based on rating
  const getRiskBadge = (rating: string) => {
    const colorMap: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800 border-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-800',
      CRITICAL: 'bg-red-100 text-red-800 border-red-800',
      EXTREME: 'bg-purple-100 text-purple-800 border-purple-800',
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colorMap[rating] || 'bg-gray-100 text-gray-800 border-gray-800'}`}>
        {rating}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [GeneralStatusEnum.SCHEDULED]: { label: 'Scheduled', variant: 'outline' },
      [GeneralStatusEnum.DRAFT]: { label: 'Draft', variant: 'outline' },
      [GeneralStatusEnum.OPEN]: { label: 'Open', variant: 'secondary' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { label: 'Waiting Approval', variant: 'secondary' },
      [GeneralStatusEnum.DONE]: { label: 'Done', variant: 'default' },
      [GeneralStatusEnum.REJECTED]: { label: 'Rejected', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  // Define filter fields for items
  const filterFields: FilterField[] = [
    {
      id: 'riskDescription',
      label: 'Risk Description',
      type: 'text',
    },
  ];

  // Define columns for items table
  const columns = [
    {
      id: 'category',
      header: 'HSE Category',
      cell: (item: RiskAssessmentItem) => (
        <div className="font-medium">
          {item.mHseCategory 
            ? `${item.mHseCategory.code} - ${item.mHseCategory.name}` 
            : 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'risk',
      header: 'Risk',
      cell: (item: RiskAssessmentItem) => (
        <div>
          {item.mRisk 
            ? `${item.mRisk.code} - ${item.mRisk.name}` 
            : 'N/A'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'riskDescription',
      header: 'Risk Description',
      cell: (item: RiskAssessmentItem) => (
        <div className="max-w-md truncate">{item.riskDescription}</div>
      ),
      isSortable: true,
    },
    {
      id: 'likelihood',
      header: 'Likelihood',
      cell: (item: RiskAssessmentItem) => <div className="text-center">{item.likelihoodLevel}</div>,
      isSortable: true,
    },
    {
      id: 'consequence',
      header: 'Consequence',
      cell: (item: RiskAssessmentItem) => <div className="text-center">{item.consequenceLevel}</div>,
      isSortable: true,
    },
    {
      id: 'riskRating',
      header: 'Risk Rating',
      cell: (item: RiskAssessmentItem) => getRiskBadge(item.riskMatrixRating),
      isSortable: true,
    },
    {
      id: 'interpretation',
      header: 'Interpretation',
      cell: (item: RiskAssessmentItem) => getRiskBadge(item.interpretation),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: RiskAssessmentItem) => (
        <DropdownMenu
          open={openDropdownId === item.id}
          onOpenChange={(open) => setOpenDropdownId(open ? item.id : null)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {/* View details - can be implemented later */}}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => handleDeleteItem(item, e)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false,
    },
  ];

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
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExportPDF}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            {canApprove && (
              <Button 
                variant="default"
                onClick={() => setIsApprovalModalOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Approval
              </Button>
            )}
            <Button onClick={() => navigate(`/risk-assessment/${id}/edit`)}>
              <FileEdit className="h-4 w-4 mr-2" />
              Edit Assessment
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-3">
          {getStatusBadge(assessment.status)}
        </div>
      </PageHeader>

      {/* Risk Assessment Details & Approval History Card - Side by Side */}
      <div ref={targetRef}>
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details & Approval History</CardTitle>
            <CardDescription>Basic information and approval progress of this risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Assessment Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Assessment Details</h3>
                </div>
                
                {assessment.description && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{assessment.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Department</p>
                    <p className="text-sm">{assessment.department?.name || 'N/A'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Assessment Date</p>
                    <p className="text-sm">
                      {assessment.assessmentDate 
                        ? format(new Date(assessment.assessmentDate), 'dd MMM yyyy') 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Assignee</p>
                    <p className="text-sm">{assessment.assignee ? `${assessment.assignee.firstName} ${assessment.assignee.lastName}` : 'N/A'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Created By</p>
                    <p className="text-sm">{assessment.creator ? `${assessment.creator.firstName} ${assessment.creator.lastName}` : assessment.createdBy || 'N/A'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Created At</p>
                    <p className="text-sm">{format(new Date(assessment.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{format(new Date(assessment.updatedAt), 'dd MMM yyyy')}</p>
                  </div>
                </div>

                {assessment.actionPlan && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Action Plan</p>
                    <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: assessment.actionPlan }} />
                  </div>
                )}
              </div>

              {/* Right Column: Approval History */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Approval History</h3>
                  <p className="text-xs text-muted-foreground">Track the approval progress</p>
                </div>
                
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : !approvalHistory?.history.length ? (
                  <div className="flex items-center gap-2 p-4 border rounded-md bg-muted/20">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No approval history available.</p>
                  </div>
                ) : (
                  <div className="relative max-h-[600px] overflow-y-auto pr-2">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-3">
                      {approvalHistory.history.map((item) => (
                        <div key={item.id} className="relative pl-6">
                          <div className="absolute left-0 w-6 flex items-center justify-center">
                            <div className={`w-2.5 h-2.5 rounded-full border-2 border-background ${
                              item.status === 'APPROVED' ? 'bg-green-500' : 
                              item.status === 'REJECTED' ? 'bg-red-500' : 
                              'bg-yellow-500'
                            }`} />
                          </div>
                          <div className="bg-muted/30 border rounded-md p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <Badge 
                                variant={
                                  item.status === 'APPROVED' ? 'default' :
                                  item.status === 'REJECTED' ? 'destructive' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {item.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-xs mb-1.5 text-muted-foreground">{item.notes}</p>
                            )}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span>By: {item.creator.name}</span>
                              <span>Dept: {item.department.name}</span>
                              <span>Pos: {item.jobPosition.name}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {approvalHistory.nextApprover && (
                        <div className="relative pl-6">
                          <div className="absolute left-0 w-6 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-background bg-blue-500 animate-pulse" />
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 border rounded-md p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Waiting for Approval</p>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-blue-700 dark:text-blue-300">
                              <span>Dept: {approvalHistory.nextApprover.department.name}</span>
                              <span>Pos: {approvalHistory.nextApprover.jobPosition.name}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment Items Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Risk Assessment Items</h2>
          <ThemeButton onClick={() => setIsAddItemDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </ThemeButton>
        </div>

        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoadingItems}
          pagination={{
            pageIndex,
            limit,
            pageCount: Math.ceil(totalItems / limit),
            onPageChange: setPageIndex,
            onPageSizeChange: setLimit,
            total: totalItems,
          }}
          filterFields={filterFields}
          onSearch={handleSearch}
          onApplyFilters={handleApplyFilters}
        />
      </div>


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
            onSubmit={handleAddItem}
            onCancel={() => setIsAddItemDialogOpen(false)}
            showCard={false}
          />
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Approval</DialogTitle>
            <DialogDescription>
              Review and submit your approval for this risk assessment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Approval Status</Label>
              <RadioGroup
                value={approvalStatus}
                onValueChange={(value) => setApprovalStatus(value as ApprovalStatus)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={ApprovalStatus.APPROVED} id="approved" />
                  <Label htmlFor="approved" className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Approve
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={ApprovalStatus.REJECTED} id="rejected" />
                  <Label htmlFor="rejected" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Reject
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter your approval notes..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApproval}
              disabled={isSubmitting || !approvalNotes.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            setOpenDropdownId(null);
          }
        }}
        title="Delete Risk Assessment Item"
        description={`Are you sure you want to delete this risk assessment item? This action cannot be undone.`}
        onConfirm={handleDeleteItemConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default RiskAssessmentDetailPage;
