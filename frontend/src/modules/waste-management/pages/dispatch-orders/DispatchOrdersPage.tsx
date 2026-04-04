import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { usePDF } from 'react-to-pdf';
import { Plus, Pencil, Trash2, Eye, Printer, Loader2 } from 'lucide-react';
import approvalService, { type ApprovalStatusHistory } from '@/modules/master-data/services/approvalService';
import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entity.constants';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { dispatchOrderService } from '../../services/wasteManagementService';
import { DispatchOrder, PaginatedResponse } from '../../types/waste-management.types';
import { DispatchOrderPDFTemplate } from '../../components/DispatchOrderPDFTemplate';

function getStatusBadge(status?: string) {
  switch (status) {
    case GeneralStatusEnum.DRAFT:
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Draft</Badge>;
    case GeneralStatusEnum.SCHEDULED:
      return <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-300">Scheduled</Badge>;
    case GeneralStatusEnum.OPEN:
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Open</Badge>;
    case GeneralStatusEnum.WAITING_APPROVAL:
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Waiting Approval</Badge>;
    case GeneralStatusEnum.DONE:
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Done</Badge>;
    case GeneralStatusEnum.REJECTED:
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
    default:
      return status ? <Badge variant="outline">{status}</Badge> : null;
  }
}

export default function DispatchOrdersPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pdfExportOrder, setPdfExportOrder] = useState<DispatchOrder | null>(null);
  const [pdfApprovalHistory, setPdfApprovalHistory] = useState<ApprovalStatusHistory | null>(null);
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);
  const [pendingRowPdfExport, setPendingRowPdfExport] = useState(false);

  const { toPDF, targetRef } = usePDF({
    filename: pdfExportOrder
      ? `${pdfExportOrder.dispatchCode}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`
      : 'dispatch-order.pdf',
  });

  const filterFields: FilterField[] = [];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search || undefined,
      };
      const response = await dispatchOrderService.getAll(params);
      const result = response.data as PaginatedResponse<DispatchOrder>;
      setData(result.data);
      setTotal(result.meta.total);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activeFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!pendingRowPdfExport || !pdfExportOrder) return;
    let cancelled = false;

    const run = async () => {
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;
      try {
        await toPDF();
        toast.success('PDF exported successfully');
      } catch {
        toast.error('Failed to export PDF');
      } finally {
        if (!cancelled) {
          setExportingPdfId(null);
          setPdfExportOrder(null);
          setPdfApprovalHistory(null);
          setPendingRowPdfExport(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [pendingRowPdfExport, pdfExportOrder, toPDF]);

  const handleDeleteClick = (item: DispatchOrder, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setDeleteId(item.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await dispatchOrderService.delete(deleteId);
      toast.success('Deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteId(null);
    }
  };

  const handleExportPdf = async (e: React.MouseEvent, item: DispatchOrder) => {
    e.stopPropagation();
    setExportingPdfId(item.id);
    try {
      const [orderRes, historyResult] = await Promise.all([
        dispatchOrderService.getById(item.id),
        approvalService.checkApprovalStatus(item.id, APPROVAL_ENTITIES.DISPATCH_ORDER).catch(() => null),
      ]);
      const order = orderRes.data as DispatchOrder;
      setPdfExportOrder(order);
      setPdfApprovalHistory(historyResult);
      setPendingRowPdfExport(true);
    } catch {
      toast.error('Failed to export PDF');
      setExportingPdfId(null);
    }
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    filters.forEach((filter) => {
      newActiveFilters[filter.id] = { value: filter.value, label: String(filter.value) };
    });
    setActiveFilters(newActiveFilters);
    setPage(1);
  };

  const columns = [
    {
      id: 'dispatchCode',
      header: 'Document no.',
      cell: (item: DispatchOrder) => item.dispatchCode,
      isSortable: true,
    },
    {
      id: 'dispatchDate',
      header: 'Date',
      cell: (item: DispatchOrder) => new Date(item.dispatchDate).toLocaleDateString(),
      isSortable: true,
    },
    {
      id: 'quantity',
      header: 'Quantity (kg)',
      cell: (item: DispatchOrder) =>
        `${Number(item.quantity).toLocaleString('id-ID')} kg`,
      isSortable: true,
    },
    {
      id: 'memo',
      header: 'Description',
      cell: (item: DispatchOrder) => (
        <span className="max-w-[200px] truncate block" title={item.memo}>
          {item.memo || '-'}
        </span>
      ),
      isSortable: false,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: DispatchOrder) => getStatusBadge(item.status),
      isSortable: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: DispatchOrder) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/waste-management/dispatch-orders/${item.id}`);
            }}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!!exportingPdfId}
            onClick={(e) => void handleExportPdf(e, item)}
            title="Export PDF"
          >
            {exportingPdfId === item.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={
              item.status === GeneralStatusEnum.WAITING_APPROVAL ||
              item.status === GeneralStatusEnum.DONE
            }
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/waste-management/dispatch-orders/${item.id}/edit`);
            }}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => handleDeleteClick(item, e)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div
        ref={targetRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
        aria-hidden="true"
      >
        {pdfExportOrder ? (
          <DispatchOrderPDFTemplate
            dispatchOrder={pdfExportOrder}
            approvalHistory={pdfApprovalHistory}
          />
        ) : null}
      </div>

      <PageHeader
        title="Dispatch Orders"
        subtitle="Manage waste dispatch orders"
        actions={
          <Button onClick={() => navigate('/waste-management/dispatch-orders/create')}>
            <Plus className="mr-2 h-4 w-4" /> Create Dispatch Order
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        pagination={{
          pageIndex: page - 1,
          limit,
          pageCount: Math.ceil(total / limit),
          onPageChange: (newPage) => setPage(newPage + 1),
          onPageSizeChange: setLimit,
          total,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={(term) => {
          setSearch(term);
          setPage(1);
        }}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Dispatch Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
