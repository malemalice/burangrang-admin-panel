import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Home, MoreHorizontal } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
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
import roomService from '../../services/roomService';
import { RoomDTO } from '../../types/master-data.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';

export default function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalRooms, setTotalRooms] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<RoomDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Room Name',
      type: 'text',
    },
    {
      id: 'code',
      label: 'Room Code',
      type: 'text',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await roomService.getRooms({
        page: pageIndex + 1,
        limit,
        search: searchTerm || undefined,
        sortBy: 'name',
        sortOrder: 'asc',
        isActive: activeFilters.status?.value === 'active' ? true :
                 activeFilters.status?.value === 'inactive' ? false :
                 undefined
      });
      setRooms(response.data);
      setTotalRooms(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  // Fetch rooms when pagination, search, filters change
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleDeleteClick = (room: RoomDTO, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    
    setIsLoading(true);
    try {
      await roomService.deleteRoom(roomToDelete.id);
      toast.success(`Room "${roomToDelete.name}" has been deleted`);
      setOpenDropdownId(null); // Ensure dropdown is closed
      fetchRooms();
    } catch (error) {
      console.error(`Failed to delete room:`, error);
      toast.error('Failed to delete room');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setRoomToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page on new search
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      if (filter.id === 'status') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: filter.value === 'active' ? 'Active' : 'Inactive'
        };
      } else {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: String(filter.value)
        };
      }
    });
    
    setActiveFilters(newActiveFilters);
    setPageIndex(0); // Reset to first page on new filters
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
    
    // Update filters based on tab
    if (value === 'all') {
      setActiveFilters({});
    } else if (value === 'active') {
      setActiveFilters({
        status: { value: 'active', label: 'Active' }
      });
    } else if (value === 'inactive') {
      setActiveFilters({
        status: { value: 'inactive', label: 'Inactive' }
      });
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Room Name',
      cell: (room: RoomDTO) => (
        <div>
          <div className="font-medium">{room.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Code: {room.code}
          </div>
        </div>
      ),
    },
    {
      id: 'area',
      header: 'Area',
      cell: (room: RoomDTO) => (
        room.area ? `${room.area.name} (${room.area.code})` : '-'
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (room: RoomDTO) => room.description || '-',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (room: RoomDTO) => (
        <Badge
          variant="outline"
          className={`${
            room.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {room.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (room: RoomDTO) => (
        <DropdownMenu
          open={openDropdownId === room.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? room.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/rooms/${room.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => handleDeleteClick(room, e)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Manage room master data"
        actions={
          <ThemeButton onClick={() => navigate('/master/rooms/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Room
          </ThemeButton>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Rooms</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={rooms}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalRooms / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalRooms
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDialogCancel();
          }
        }}
        title="Delete Room"
        description={`Are you sure you want to delete "${roomToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
