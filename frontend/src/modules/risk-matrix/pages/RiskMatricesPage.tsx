import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, MoreHorizontal } from 'lucide-react';
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
import { RiskMatrix, RiskMatrixSearchParams, RiskRatingEnum } from '../types/risk-matrix.types';
import { useRiskMatrices } from '../hooks/useRiskMatrix';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';

const RiskMatricesPage = () => {
  const navigate = useNavigate();
  const { riskMatrices, totalRiskMatrices, isLoading, fetchRiskMatrices, deleteRiskMatrix } = useRiskMatrices();
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [riskMatrixToDelete, setRiskMatrixToDelete] = useState<RiskMatrix | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'likelihoodName',
      label: 'Likelihood Name',
      type: 'text',
    },
    {
      id: 'consequenceName',
      label: 'Consequence Name',
      type: 'text',
    },
    {
      id: 'interpretation',
      label: 'Risk Rating',
      type: 'select',
      options: [
        { label: 'Low', value: RiskRatingEnum.LOW },
        { label: 'Medium', value: RiskRatingEnum.MEDIUM },
        { label: 'High', value: RiskRatingEnum.HIGH },
        { label: 'Extreme', value: RiskRatingEnum.EXTREME },
      ],
    },
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
  ];

  const fetchData = useCallback(async () => {
    const params: RiskMatrixSearchParams = {
      page: pageIndex + 1,
      limit,
      sortBy: 'likelihoodLevel',
      sortOrder: 'asc',
      search: searchTerm,
      isActive: activeTab === 'all' ? undefined : activeTab === 'active',
    };

    await fetchRiskMatrices(params);
  }, [pageIndex, limit, searchTerm, activeTab, fetchRiskMatrices]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteClick = (riskMatrix: RiskMatrix, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setRiskMatrixToDelete(riskMatrix);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!riskMatrixToDelete) return;

    try {
      await deleteRiskMatrix(riskMatrixToDelete.id);
      setOpenDropdownId(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete risk matrix:', error);
    } finally {
      setDeleteDialogOpen(false);
      setRiskMatrixToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setRiskMatrixToDelete(null);
    setOpenDropdownId(null);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filterValues: FilterValue[]) => {
    const newFilters: Record<string, { value: any; label: string }> = {};

    filterValues.forEach((filter) => {
      newFilters[filter.id] = {
        value: filter.value,
        label: String(filter.value),
      };
    });

    setActiveFilters(newFilters);
    setPageIndex(0);
  };

  const getRiskRatingBadgeVariant = (rating: RiskRatingEnum) => {
    switch (rating) {
      case RiskRatingEnum.LOW:
        return 'bg-green-100 text-green-800 border-0';
      case RiskRatingEnum.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-0';
      case RiskRatingEnum.HIGH:
        return 'bg-orange-100 text-orange-800 border-0';
      case RiskRatingEnum.EXTREME:
        return 'bg-red-100 text-red-800 border-0';
      default:
        return 'bg-gray-100 text-gray-800 border-0';
    }
  };

  const columns = [
    {
      id: 'likelihood',
      header: 'Likelihood',
      cell: (riskMatrix: RiskMatrix) => (
        <div>
          <div className="font-medium">{riskMatrix.likelihoodLevel} - {riskMatrix.likelihoodName}</div>
          <div className="text-sm text-muted-foreground">{riskMatrix.likelihoodDesc}</div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'consequence',
      header: 'Consequence',
      cell: (riskMatrix: RiskMatrix) => (
        <div>
          <div className="font-medium">{riskMatrix.consequenceLevel} - {riskMatrix.consequenceName}</div>
          <div className="text-sm text-muted-foreground">{riskMatrix.consequenceDesc}</div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'interpretation',
      header: 'Risk Rating',
      cell: (riskMatrix: RiskMatrix) => (
        <Badge variant="outline" className={getRiskRatingBadgeVariant(riskMatrix.interpretation)}>
          {riskMatrix.interpretation}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (riskMatrix: RiskMatrix) => (
        <Badge
          variant="outline"
          className={riskMatrix.isActive ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-800 border-0'}
        >
          {riskMatrix.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (riskMatrix: RiskMatrix) => (
        <DropdownMenu open={openDropdownId === riskMatrix.id} onOpenChange={(open) => setOpenDropdownId(open ? riskMatrix.id : null)}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/risk-matrix/${riskMatrix.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => handleDeleteClick(riskMatrix, e)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Risk Matrix"
        subtitle="Manage risk matrix entries combining likelihood and consequence levels"
        actions={
          <Button onClick={() => navigate('/risk-matrix/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Risk Matrix Entry
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={riskMatrices}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalRiskMatrices / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalRiskMatrices,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogCancel();
        }}
        title="Delete Risk Matrix Entry"
        description={`Are you sure you want to delete this risk matrix entry? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default RiskMatricesPage;
