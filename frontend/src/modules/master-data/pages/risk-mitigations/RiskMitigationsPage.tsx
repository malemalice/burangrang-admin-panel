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
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
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
      type: 'select',
      options: [
        { label: 'All Risks', value: 'all' },
        ...risks.map(risk => ({ label: risk.name, value: risk.id }))
      ],
    },
    {
      id: 'level',
      label: 'Level',
      type: 'select',
      options: [
        { label: 'All Levels', value: 'all' },
        { label: 'Level 1', value: '1' },
        { label: 'Level 2', value: '2' },
        { label: 'Level 3', value: '3' },
        { label: 'Level 4', value: '4' },
        { label: 'Level 5', value: '5' },
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

  // Fetch risk mitigations
  const fetchMitigations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await riskMitigationService.getAll({
        page: pageIndex + 1,
        limit,
        isActive: activeTab === 'all' ? undefined : activeTab === 'active',
        search: searchTerm,
        sortBy: sorting?.id,
        sortOrder: sorting?.desc ? 'desc' : 'asc',
        riskId: selectedRiskId !== 'all' ? selectedRiskId : undefined,
        level: selectedLevel,
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
  }, [pageIndex, limit, activeTab, searchTerm, sorting, selectedRiskId, selectedLevel]);

  useEffect(() => {
    fetchMitigations();
  }, [fetchMitigations]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  // Handle filter application
  const handleApplyFilters = (filters: FilterValue[]) => {
    const newFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      const field = filterFields.find(f => f.id === filter.id);
      if (field) {
        let label = '';
        if (field.type === 'select' && field.options) {
          const option = field.options.find(opt => opt.value === filter.value);
          label = option?.label || '';
        } else {
          label = String(filter.value);
        }
        
        // Set the specific filter state variables
        if (filter.id === 'riskId') {
          setSelectedRiskId(filter.value === 'all' ? undefined : filter.value);
        } else if (filter.id === 'level') {
          setSelectedLevel(filter.value === 'all' ? undefined : Number(filter.value));
        }
        
        newFilters[filter.id] = { value: filter.value, label };
      }
    });
    
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
      id: 'level',
      header: 'Level',
      cell: (mitigation: RiskMitigation) => (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${
              mitigation.level >= 4 
                ? 'bg-red-100 text-red-800'
                : mitigation.level >= 3
                ? 'bg-orange-100 text-orange-800'
                : 'bg-blue-100 text-blue-800'
            } border-0 px-2 py-1`}
          >
            Level {mitigation.level}
          </Badge>
        </div>
      ),
      isSortable: true,
    },
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
      id: 'mitigationDescription',
      header: 'Description',
      cell: (mitigation: RiskMitigation) => (
        <div className="max-w-md truncate">{mitigation.mitigationDescription}</div>
      ),
      isSortable: true,
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
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
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
