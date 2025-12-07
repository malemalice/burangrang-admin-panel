import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { Edit, Trash2, Eye, MoreHorizontal, ToggleLeft, ToggleRight, FilePlus2 } from 'lucide-react';
import emailTemplateService from '../services/emailTemplateService';
import { EmailTemplate } from '@/modules/mail-templates/types/email-template.types';

const EmailTemplatesPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filterFields: FilterField[] = [
    { id: 'code', label: 'Code', type: 'text' },
    { id: 'name', label: 'Name', type: 'text' },
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

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit,
        search: searchTerm,
        filters: {
          ...Object.entries(activeFilters).reduce((acc, [key, item]) => {
            if (key === 'status') {
              return { ...acc, isActive: item.value === 'active' ? 'true' : 'false' };
            }
            return { ...acc, [key]: item.value };
          }, {} as Record<string, any>),
          ...(activeFilters.status?.value
            ? { isActive: activeFilters.status.value === 'active' ? 'true' : 'false' }
            : {}),
        },
      };
      const response = await emailTemplateService.getEmailTemplates(params);
      setTemplates(response.data);
      setTotal(response.meta.total);
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeleteClick = (template: EmailTemplate, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    setIsLoading(true);
    try {
      await emailTemplateService.deleteEmailTemplate(templateToDelete.id);
      toast.success('Template deleted successfully');
      setOpenDropdownId(null); // Ensure dropdown is closed
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  const handleToggle = async (template: EmailTemplate) => {
    setIsLoading(true);
    try {
      await emailTemplateService.toggleEmailTemplate(template.id);
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Failed to toggle template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    filters.forEach(filter => {
      if (filter.id === 'status') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: filter.value === 'active' ? 'Active' : 'Inactive',
        };
      } else {
        newActiveFilters[filter.id] = { value: filter.value, label: String(filter.value) };
      }
    });
    setActiveFilters(newActiveFilters);
    setPageIndex(0);
  };

  const columns = [
    {
      id: 'code',
      header: 'Code',
      cell: (t: EmailTemplate) => <span className="font-mono text-sm">{t.code}</span>,
      isSortable: true,
    },
    {
      id: 'name',
      header: 'Name',
      cell: (t: EmailTemplate) => <span className="font-medium">{t.name}</span>,
      isSortable: true,
    },
    {
      id: 'subject',
      header: 'Subject',
      cell: (t: EmailTemplate) => <span className="text-gray-700">{t.subject}</span>,
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (t: EmailTemplate) => (
        <Badge
          variant="outline"
          className={`${t.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} border-0`}
        >
          {t.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (t: EmailTemplate) => (
        <DropdownMenu
          open={openDropdownId === t.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? t.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/mail-templates/${t.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/mail-templates/${t.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggle(t)}>
              {t.status === 'active' ? (
                <>
                  <ToggleLeft className="mr-2 h-4 w-4" /> Deactivate
                </>
              ) : (
                <>
                  <ToggleRight className="mr-2 h-4 w-4" /> Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => handleDeleteClick(t, e)}
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
        title="Email Templates"
        subtitle="Manage system email templates"
        actions={
          <ThemeButton onClick={() => navigate('/mail-templates/new')}>
            <FilePlus2 className="mr-2 h-4 w-4" /> New Template
          </ThemeButton>
        }
      />

      <DataTable
        columns={columns}
        data={templates}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(total / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total,
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
        title="Delete Template"
        description={`Are you sure you want to delete "${templateToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default EmailTemplatesPage;


