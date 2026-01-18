import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Shield, MoreHorizontal } from 'lucide-react';
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
        const response = await riskService.getAll({ limit: 100 });
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

  // Table columns
  const columns = [
    {
      id: 'riskId',
      header: 'Risk',
      cell: (mitigation: RiskMitigation) => (
        <div>
          <div className="font-medium">
            {mitigation.risk?.name || getRiskName(mitigation.riskId)}
          </div>
          {mitigation.risk && (
            <div className="text-xs text-gray-500 mt-1">
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
      cell: (mitigation: RiskMitigation) => (
        <div className="max-w-xs">
          {mitigation.eliminate ? (
            <div className="truncate text-sm">{mitigation.eliminate}</div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'transfer',
      header: 'Transfer',
      cell: (mitigation: RiskMitigation) => (
        <div className="max-w-xs">
          {mitigation.transfer ? (
            <div className="truncate text-sm">{mitigation.transfer}</div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'reduce',
      header: 'Reduce',
      cell: (mitigation: RiskMitigation) => (
        <div className="max-w-xs">
          {mitigation.reduce ? (
            <div className="truncate text-sm">{mitigation.reduce}</div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'accept',
      header: 'Accept',
      cell: (mitigation: RiskMitigation) => (
        <div className="max-w-xs">
          {mitigation.accept ? (
            <div className="truncate text-sm">{mitigation.accept}</div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'isActive',
      header: 'Status',
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
