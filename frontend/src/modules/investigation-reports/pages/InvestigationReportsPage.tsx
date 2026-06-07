import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Eye, Trash2, Pencil, FileDown, Loader2 } from 'lucide-react';
import { buildPdfOptions, generateTableAwarePdf } from '@/core/lib/pdfExport';
import { Checkbox } from '@/core/components/ui/checkbox';
import InvestigationReportPDFTemplate from '../components/InvestigationReportPDFTemplate';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { usePermissions } from '@/core/hooks/usePermissions';
import investigationReportsService, { type FindInvestigationReportsParams } from '../services/investigationReportsService';
import {
  InvestigationSignatoryRoleEnum,
  InvestigationStatusEnum,
  type InvestigationReport,
} from '../types/investigation-report.types';

const STATUS_CONFIG: Record<InvestigationStatusEnum, { label: string; className: string }> = {
  [InvestigationStatusEnum.DRAFT]: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
  [InvestigationStatusEnum.COMPLETE]: {
    label: 'Complete',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
};

const InvestigationReportsPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('investigation-report:update');
  const canDelete = hasPermission('investigation-report:delete');
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState<InvestigationReport[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<InvestigationReport | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const bulkPdfRef = useRef<HTMLDivElement>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const sortBy = searchParams.get('sortBy') || 'incidentDate';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  const search = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || 'all';

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FindInvestigationReportsParams = {
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
      };
      if (statusParam && statusParam !== 'all') {
        params.status = statusParam;
      }
      const response = await investigationReportsService.getAll(params);
      setReports(response.data);
      setTotal(response.meta?.total ?? 0);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to fetch investigation reports', error);
      toast.error('Failed to load investigation reports');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, statusParam]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateParam = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reports.length && reports.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reports.map((r) => r.id)));
    }
  };

  const handleBulkExportPDF = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsBulkExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const children = Array.from(bulkPdfRef.current?.children ?? []);
      for (let i = 0; i < children.length; i++) {
        const fakeRef = { current: children[i] as HTMLElement };
        await generateTableAwarePdf(
          fakeRef,
          buildPdfOptions({
            method: 'save',
            filename: `${selectedReports[i]?.reportNumber ?? `report-${i + 1}`}.pdf`,
          }),
        );
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDFs');
    } finally {
      setIsBulkExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await investigationReportsService.delete(deleteTarget.id);
      toast.success('Investigation report deleted');
      setDeleteTarget(null);
      await fetchReports();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete investigation report');
    }
  };

  const selectedReports = reports.filter((r) => selectedIds.has(r.id));

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={reports.length > 0 && selectedIds.size === reports.length}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all"
          />
        ),
        headerClassName: 'w-10',
        cellClassName: 'w-10',
        cell: (row: InvestigationReport) => (
          <Checkbox
            checked={selectedIds.has(row.id)}
            onCheckedChange={() => toggleSelect(row.id)}
            aria-label={`Select ${row.reportNumber}`}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      {
        id: 'reportNumber',
        header: 'Report Number',
        isSortable: true,
        cell: (row: InvestigationReport) => (
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {row.reportNumber}
          </span>
        ),
      },
      {
        id: 'incidentDate',
        header: 'Incident Date',
        isSortable: true,
        cell: (row: InvestigationReport) =>
          row.incident?.incidentDate
            ? format(new Date(row.incident.incidentDate), 'dd MMM yyyy')
            : '—',
      },
      {
        id: 'area',
        header: 'Area',
        cell: (row: InvestigationReport) => row.incident?.area?.name ?? '—',
      },
      {
        id: 'incidentType',
        header: 'Incident Type',
        cell: (row: InvestigationReport) =>
          row.incident?.incidentType?.replace(/_/g, ' ') ?? '—',
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row: InvestigationReport) => {
          const cfg = STATUS_CONFIG[row.status];
          return <Badge className={cfg.className}>{cfg.label}</Badge>;
        },
      },
      {
        id: 'leadInvestigator',
        header: 'Lead Investigator',
        cell: (row: InvestigationReport) => {
          const lead = row.signatories?.find(
            (s) => s.signatoryRole === InvestigationSignatoryRoleEnum.LEAD_INVESTIGATOR,
          );
          return lead?.name || lead?.roleName || '—';
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (row: InvestigationReport) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/investigation-reports/${row.id}`)}
              className="text-blue-600 hover:bg-blue-50"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/investigation-reports/${row.id}/edit`)}
                className="text-amber-600 hover:bg-amber-50"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(row)}
                className="text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, canEdit, canDelete, selectedIds, reports],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investigation Reports"
        subtitle="HSE post-incident accident investigation reports (BSJ/F/H-3-3.5C)"
      >
        <Tabs
          value={statusParam}
          onValueChange={(v) => updateParam({ status: v === 'all' ? undefined : v, page: '1' })}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={InvestigationStatusEnum.DRAFT}>Draft</TabsTrigger>
            <TabsTrigger value={InvestigationStatusEnum.COMPLETE}>Complete</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={reports}
        isLoading={isLoading}
        pagination={{
          pageIndex: page - 1,
          limit,
          pageCount: Math.max(1, Math.ceil(total / limit)),
          onPageChange: (idx: number) => updateParam({ page: String(idx + 1) }),
          onPageSizeChange: (size: number) => updateParam({ limit: String(size), page: '1' }),
          total,
        }}
        searchValue={search}
        onSearch={(value: string) => updateParam({ search: value || undefined, page: '1' })}
        searchPlaceholder="Search by report number, incident code or subject..."
        sorting={{ id: sortBy, desc: sortOrder === 'desc' }}
        onSortingChange={(s) =>
          updateParam({
            sortBy: s?.id ?? 'incidentDate',
            sortOrder: s?.desc ? 'desc' : 'asc',
          })
        }
        toolbarExtra={
          selectedIds.size > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExportPDF}
              disabled={isBulkExporting}
            >
              {isBulkExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              {isBulkExporting ? 'Exporting...' : `Export PDF (${selectedIds.size})`}
            </Button>
          ) : undefined
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Investigation Report"
        description={`Are you sure you want to delete report "${deleteTarget?.reportNumber}"?`}
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />

      {/* Hidden bulk PDF render target */}
      {selectedReports.length > 0 && (
        <div
          ref={bulkPdfRef}
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
          aria-hidden="true"
        >
          {selectedReports.map((report, i) => (
            <div
              key={report.id}
              style={i < selectedReports.length - 1 ? { pageBreakAfter: 'always' } : undefined}
            >
              <InvestigationReportPDFTemplate report={report} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvestigationReportsPage;
