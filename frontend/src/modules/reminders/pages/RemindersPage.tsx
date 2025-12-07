import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, BellPlus, Eye, MoreHorizontal, Calendar, Clock, Repeat } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button, ThemeButton } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import reminderService from '../services/reminderService';
import { Reminder, ReminderStatus } from '../types/reminder.types';

const RemindersPage = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalReminders, setTotalReminders] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields for reminders
  const filterFields: FilterField[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: ReminderStatus.PENDING },
        { label: 'Sent', value: ReminderStatus.SENT },
        { label: 'Expired', value: ReminderStatus.EXPIRED },
        { label: 'Cancelled', value: ReminderStatus.CANCELLED },
        { label: 'Failed', value: ReminderStatus.FAILED },
      ],
    },
    {
      id: 'entity',
      label: 'Entity',
      type: 'text',
    },
    {
      id: 'fromDate',
      label: 'From Date',
      type: 'date',
    },
    {
      id: 'toDate',
      label: 'To Date',
      type: 'date',
    },
  ];

  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit,
        search: searchTerm,
        filters: {
          ...Object.entries(activeFilters).reduce((acc, [key, item]) => {
            return {
              ...acc,
              [key]: item.value,
            };
          }, {}),
        },
      };

      const response = await reminderService.getReminders(params);
      setReminders(response.data);
      setTotalReminders(response.meta.total);

      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      toast.error('Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  // Fetch reminders when dependencies change
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleDeleteClick = (reminder: Reminder, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setReminderToDelete(reminder);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reminderToDelete) return;

    setIsLoading(true);
    try {
      await reminderService.deleteReminder(reminderToDelete.id);
      toast.success('Reminder deleted successfully');
      setOpenDropdownId(null); // Ensure dropdown is closed
      fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setReminderToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setReminderToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page on new search
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);

    // Update filters based on tab
    if (value === 'all') {
      setActiveFilters({});
    } else {
      setActiveFilters({
        status: { value: value.toUpperCase(), label: value.charAt(0).toUpperCase() + value.slice(1) },
      });
    }
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};

    filters.forEach((filter) => {
      if (filter.id === 'status') {
        const statusLabels: Record<string, string> = {
          [ReminderStatus.PENDING]: 'Pending',
          [ReminderStatus.SENT]: 'Sent',
          [ReminderStatus.EXPIRED]: 'Expired',
          [ReminderStatus.CANCELLED]: 'Cancelled',
          [ReminderStatus.FAILED]: 'Failed',
        };
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: statusLabels[filter.value as string] || String(filter.value),
        };
      } else {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: String(filter.value),
        };
      }
    });

    setActiveFilters(newActiveFilters);
    setPageIndex(0); // Reset to first page on new filters
  };

  const getStatusBadgeVariant = (status: ReminderStatus) => {
    switch (status) {
      case ReminderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ReminderStatus.SENT:
        return 'bg-green-100 text-green-800';
      case ReminderStatus.EXPIRED:
        return 'bg-gray-100 text-gray-800';
      case ReminderStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      case ReminderStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const columns = [
    {
      id: 'message',
      header: 'Message',
      cell: (reminder: Reminder) => (
        <div className="flex items-center gap-3">
          <div>
            <div className="font-medium">{reminder.message}</div>
            {reminder.entity && (
              <div className="text-sm text-gray-500">
                {reminder.entity} {reminder.entityId ? `(${reminder.entityId})` : ''}
              </div>
            )}
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'remindAt',
      header: 'Remind At',
      cell: (reminder: Reminder) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{formatDate(reminder.remindAt)}</span>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'repeatType',
      header: 'Repeat',
      cell: (reminder: Reminder) => (
        <div className="flex items-center gap-2">
          {reminder.repeatType && reminder.repeatType !== 'NONE' ? (
            <>
              <Repeat className="h-4 w-4 text-gray-500" />
              <span>{reminder.repeatType}</span>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (reminder: Reminder) => (
        <Badge variant="outline" className={`${getStatusBadgeVariant(reminder.status)} border-0`}>
          {reminder.status}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'lastSentAt',
      header: 'Last Sent',
      cell: (reminder: Reminder) => (
        <div className="flex items-center gap-2">
          {reminder.lastSentAt ? (
            <>
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{formatDate(reminder.lastSentAt)}</span>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (reminder: Reminder) => (
        <DropdownMenu
          open={openDropdownId === reminder.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? reminder.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/reminders/${reminder.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/reminders/${reminder.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => handleDeleteClick(reminder, e)}
              className="text-red-600 focus:text-red-600"
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
    <>
      <PageHeader
        title="Reminders"
        subtitle="Manage your reminders and notifications"
        actions={
          <ThemeButton onClick={() => navigate('/reminders/new')}>
            <BellPlus className="mr-2 h-4 w-4" /> Add Reminder
          </ThemeButton>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Reminders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={reminders}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalReminders / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalReminders,
        }}
        filterFields={filterFields}
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
        title="Delete Reminder"
        description={`Are you sure you want to delete this reminder? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default RemindersPage;

