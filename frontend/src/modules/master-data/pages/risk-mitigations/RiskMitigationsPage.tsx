import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Badge } from '@/core/components/ui/badge';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { riskMitigationService, riskService } from '@/modules/master-data';
import { RiskMitigation, Risk } from '@/core/lib/types';

const RiskMitigationsPage = () => {
  const navigate = useNavigate();
  const [mitigations, setMitigations] = useState<RiskMitigation[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalMitigations, setTotalMitigations] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mitigationToDelete, setMitigationToDelete] = useState<RiskMitigation | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);
  const [selectedRiskId, setSelectedRiskId] = useState<string | undefined>(undefined);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Fetch risks for filter dropdown
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const response = await riskService.getAll({ limit: 100, options: true });
        setRisks(response.data);
      } catch (error) {
        toast.error('Failed to fetch risks for filtering');
      }
    };
    
    fetchRisks();
  }, []);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'riskId',
      label: 'Risk',
      type: 'searchableSelect',
      options: [
        { label: 'All Risks', value: 'all' },
        ...risks.map(risk => ({ label: risk.name, value: risk.id }))
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  // Fetch risk mitigations. Use activeFilters.status when set, else activeTab (MDRMG-006, MDRMG-008/009).
  const fetchMitigations = useCallback(async () => {
    try {
      setIsLoading(true);
      const isActiveFromFilter = activeFilters.status
        ? (activeFilters.status.value === 'active' ? true : activeFilters.status.value === 'inactive' ? false : undefined)
        : undefined;
      const isActive = isActiveFromFilter !== undefined
        ? isActiveFromFilter
        : (activeTab === 'all' ? undefined : activeTab === 'active');
      const response = await riskMitigationService.getAll({
        page: pageIndex + 1,
        limit,
        isActive,
        search: searchTerm.trim() || undefined,
        sortBy: sorting?.id,
        sortOrder: sorting?.desc ? 'desc' : 'asc',
        riskId: selectedRiskId && selectedRiskId !== 'all' ? selectedRiskId : undefined,
      });
      setMitigations(response.data);
      setTotalMitigations(response.meta.total);
      
      // Update pageIndex based on returned page from backend
      if (response.meta.page) {
        setPageIndex(response.meta.page - 1); // Convert 1-based to 0-based
      }
    } catch (error) {
      toast.error('Failed to fetch risk mitigations');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, activeTab, searchTerm, activeFilters, sorting, selectedRiskId]);

  useEffect(() => {
    fetchMitigations();
  }, [fetchMitigations]);

  // Handle tab change (MDRMG-012/013: set activeFilters so filter badges appear above list like user management)
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
    if (value === 'all') {
      setActiveFilters(prev => {
        const next = { ...prev };
        delete next.status;
        return next;
      });
    } else if (value === 'active') {
      setActiveFilters(prev => ({ ...prev, status: { value: 'active', label: 'Active' } }));
    } else if (value === 'inactive') {
      setActiveFilters(prev => ({ ...prev, status: { value: 'inactive', label: 'Inactive' } }));
    }
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  // Handle filter application (MDRMG-006, MDRMG-007: status filter, riskId, and X to clear update data)
  const handleApplyFilters = (filters: FilterValue[]) => {
    const newFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      const field = filterFields.find(f => f.id === filter.id);
      if (!field) return;
      // Skip 'all' values - treat as no filter
      if (filter.id === 'riskId' && filter.value === 'all') return;
      if (filter.id === 'status' && filter.value === 'all') return;
      let label = '';
      if (field.type === 'select' && field.options) {
        const option = field.options.find(opt => opt.value === filter.value);
        label = option?.label || '';
      } else if (field.type === 'searchableSelect' && field.options) {
        const option = field.options.find(opt => String(opt.value) === String(filter.value));
        label = option?.label || String(filter.value);
      } else {
        label = String(filter.value);
      }
      newFilters[filter.id] = { value: filter.value, label };
    });
    
    // Sync selectedRiskId: set when riskId in filters and not 'all', else undefined (MDRMG-007)
    const riskFilter = filters.find(f => f.id === 'riskId');
    setSelectedRiskId(riskFilter && riskFilter.value !== 'all' ? riskFilter.value : undefined);
    
    // Sync activeTab with status filter (MDRMG-006, MDRMG-007)
    const statusFilter = filters.find(f => f.id === 'status');
    if (!statusFilter || statusFilter.value === 'all') {
      setActiveTab('all');
    } else {
      setActiveTab(String(statusFilter.value));
    }
    
    setActiveFilters(newFilters);
    setPageIndex(0);
  };

  // Handle sorting
  const handleSortingChange = (newSorting: { id: string; desc: boolean } | null) => {
    setSorting(newSorting);
    setPageIndex(0);
  };

  // Handle delete
  const handleDelete = (mitigation: RiskMitigation, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setMitigationToDelete(mitigation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mitigationToDelete) return;

    try {
      await riskMitigationService.delete(mitigationToDelete.id);
      toast.success('Risk mitigation deleted successfully');
      setOpenDropdownId(null); // Ensure dropdown is closed
      fetchMitigations();
    } catch (error) {
      toast.error('Failed to delete risk mitigation');
    } finally {
      setDeleteDialogOpen(false);
      setMitigationToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setMitigationToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  // Get risk name by ID
  const getRiskName = (riskId: string) => {
    const risk = risks.find(r => r.id === riskId);
    return risk ? risk.name : 'Unknown';
  };

  // Truncated cell with ellipsis and full text on hover (respects column width)
  const TruncateCell = ({ text }: { text: string | null | undefined }) => {
    if (!text) return <span className="text-gray-400 text-sm">-</span>;
    return (
      <div className="min-w-0 w-full max-w-full" title={text}>
        <span className="block truncate text-sm">{text}</span>
      </div>
    );
  };

  // Column width classes: fixed layout so table fits viewport (totals 100%)
  const colRisk = 'w-[16%] min-w-0';
  const colStrategy = 'w-[15%] min-w-0';
  const colStatus = 'w-[9%] min-w-0';
  const colActions = 'w-[6%] min-w-0';
  const cellOverflow = 'overflow-hidden';

  const getControlHierarchyText = (m: RiskMitigation): string | undefined => {
    const parts: string[] = [];
    if (m.eliminationControl?.trim()) parts.push(`Elimination Control\n${m.eliminationControl}`);
    if (m.substitutionControl?.trim()) parts.push(`Substitution Control\n${m.substitutionControl}`);
    if (m.engineeringControl?.trim()) parts.push(`Engineering Control\n${m.engineeringControl}`);
    if (m.administrationControl?.trim()) parts.push(`Administration Control\n${m.administrationControl}`);
    if (m.personalProtectiveEquipment?.trim()) parts.push(`Personal Protective Equipment\n${m.personalProtectiveEquipment}`);
    const out = parts.join('\n\n');
    return out.length > 0 ? out : undefined;
  };

  // Table columns
  const columns = [
    {
      id: 'riskId',
      header: 'Risk',
      headerClassName: colRisk,
      cellClassName: cellOverflow,
      cell: (mitigation: RiskMitigation) => (
        <div className="min-w-0 w-full max-w-full">
          <div className="font-medium truncate" title={mitigation.risk?.name || getRiskName(mitigation.riskId)}>
            {mitigation.risk?.name || getRiskName(mitigation.riskId)}
          </div>
          {mitigation.risk && (
            <div className="text-xs text-gray-500 truncate">
              {mitigation.risk.code}
            </div>
          )}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'eliminate',
      header: 'Eliminate',
      headerClassName: colStrategy,
      cellClassName: cellOverflow,
      cell: (mitigation: RiskMitigation) => <TruncateCell text={mitigation.eliminate ?? undefined} />,
      isSortable: false,
    },
    {
      id: 'transfer',
      header: 'Transfer',
      headerClassName: colStrategy,
      cellClassName: cellOverflow,
      cell: (mitigation: RiskMitigation) => <TruncateCell text={mitigation.transfer ?? undefined} />,
      isSortable: false,
    },
    {
      id: 'controls',
      header: 'Controls',
      headerClassName: colStrategy,
      cellClassName: cellOverflow,
      cell: (mitigation: RiskMitigation) => <TruncateCell text={getControlHierarchyText(mitigation)} />,
      isSortable: false,
    },
    {
      id: 'accept',
      header: 'Accept',
      headerClassName: colStrategy,
      cellClassName: cellOverflow,
      cell: (mitigation: RiskMitigation) => <TruncateCell text={mitigation.accept ?? undefined} />,
      isSortable: false,
    },
    {
      id: 'isActive',
      header: 'Status',
      headerClassName: colStatus,
      cellClassName: cellOverflow,
      cell: (mitigation: RiskMitigation) => (
        <Badge
          variant="outline"
          className={`${
            mitigation.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {mitigation.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: '',
      headerClassName: colActions,
      cellClassName: 'overflow-visible',
      cell: (mitigation: RiskMitigation) => (
        <DropdownMenu
          open={openDropdownId === mitigation.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? mitigation.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/risk-mitigations/${mitigation.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/master/risk-mitigations/${mitigation.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => handleDelete(mitigation, e)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Risk Mitigations"
        subtitle="Manage your organization's risk mitigation measures"
        actions={
          <Button onClick={() => navigate('/master/risk-mitigations/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Mitigation
          </Button>
        }
      >
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Mitigations</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={mitigations}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalMitigations / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalMitigations
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        searchPlaceholder="Search by risk name..."
        tableClassName="table-fixed w-full"
        tableContainerClassName="max-h-[calc(100vh-320px)] overflow-y-auto min-w-0"
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDialogCancel();
          }
        }}
        title="Delete Risk Mitigation"
        description={`Are you sure you want to delete this mitigation? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default RiskMitigationsPage;
