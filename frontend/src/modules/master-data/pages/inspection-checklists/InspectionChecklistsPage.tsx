import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  FolderOpen,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import inspectionChecklistService from '../../services/inspectionChecklistService';
import { InspectionChecklistDTO } from '../../types/master-data.types';
import InspectionChecklistForm from './InspectionChecklistForm';

type Depth = 0 | 1 | 2;

interface FormState {
  open: boolean;
  depth: Depth;
  parentId?: string;
  initialData?: InspectionChecklistDTO;
}

const INITIAL_FORM: FormState = { open: false, depth: 0 };

export default function InspectionChecklistsPage() {
  const { hasPermission } = usePermissions();
  const [templates, setTemplates] = useState<InspectionChecklistDTO[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>({ id: 'order', desc: false });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [treeData, setTreeData] = useState<Record<string, InspectionChecklistDTO>>({});
  const [treeLoading, setTreeLoading] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: InspectionChecklistDTO | null }>({ open: false, item: null });

  const filterFields: FilterField[] = [
    { id: 'search', label: 'Name / Code', type: 'text' },
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
      const res = await inspectionChecklistService.getAll({
        page: pageIndex + 1,
        limit,
        search: searchTerm || undefined,
        sortBy: sorting?.id,
        sortOrder: sorting?.desc ? 'desc' : 'asc',
        isActive:
          activeFilters.status?.value === 'active'
            ? true
            : activeFilters.status?.value === 'inactive'
              ? false
              : undefined,
        rootsOnly: true,
      });
      setTemplates(res.data);
      setTotal(res.meta.total);
    } catch {
      toast.error('Failed to load inspection checklists');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters, sorting]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const fetchTree = async (templateId: string) => {
    setTreeLoading((prev) => new Set(prev).add(templateId));
    try {
      const data = await inspectionChecklistService.getById(templateId);
      setTreeData((prev) => ({ ...prev, [templateId]: data }));
    } catch {
      toast.error('Failed to load checklist tree');
    } finally {
      setTreeLoading((prev) => {
        const next = new Set(prev);
        next.delete(templateId);
        return next;
      });
    }
  };

  const toggleExpand = (templateId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
        if (!treeData[templateId]) {
          fetchTree(templateId);
        }
      }
      return next;
    });
  };

  const refreshTree = (templateId: string) => {
    fetchTree(templateId);
    fetchTemplates();
  };

  const openCreate = (depth: Depth, parentId?: string) => {
    setOpenDropdownId(null);
    setFormState({ open: true, depth, parentId });
  };

  const openEdit = (item: InspectionChecklistDTO, depth: Depth) => {
    setOpenDropdownId(null);
    setFormState({ open: true, depth, initialData: item });
  };

  const openDelete = (item: InspectionChecklistDTO) => {
    setOpenDropdownId(null);
    setDeleteDialog({ open: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item) return;
    try {
      await inspectionChecklistService.delete(deleteDialog.item.id);
      toast.success(`"${deleteDialog.item.name}" deleted`);
      const rootId = findRootId(deleteDialog.item.id);
      if (rootId) refreshTree(rootId);
      else fetchTemplates();
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to delete'));
    } finally {
      setDeleteDialog({ open: false, item: null });
    }
  };

  const findRootId = (itemId: string): string | null => {
    for (const [rootId, tree] of Object.entries(treeData)) {
      if (rootId === itemId) return null;
      const found = tree.children?.some(
        (cat) => cat.id === itemId || cat.children?.some((leaf) => leaf.id === itemId),
      );
      if (found) return rootId;
    }
    return null;
  };

  const columns = [
    {
      id: 'name',
      header: 'Template Name',
      isSortable: false,
      cell: (template: InspectionChecklistDTO) => {
        const isExpanded = expandedIds.has(template.id);
        const isLoadingTree = treeLoading.has(template.id);
        const tree = treeData[template.id];

        return (
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleExpand(template.id)}
                className="p-0.5 rounded hover:bg-muted transition-colors"
              >
                {isLoadingTree ? (
                  <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                ) : isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <FolderOpen className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">
                {template.code ? (
                  <span className="text-muted-foreground text-xs mr-1">[{template.code}]</span>
                ) : null}
                {template.name}
              </span>
            </div>

            {isExpanded && tree && (
              <div className="mt-3 ml-6 space-y-1">
                {tree.children && tree.children.length > 0 ? (
                  tree.children.map((category) => (
                    <div key={category.id} className="rounded-md border border-border bg-muted/30">
                      <div className="flex items-center justify-between px-3 py-2 gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-semibold text-muted-foreground w-5 shrink-0">
                            {category.code ?? ''}
                          </span>
                          <span className="text-sm font-medium truncate">{category.name}</span>
                          {!category.isActive && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-500 border-0 text-xs shrink-0">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasPermission('inspection-checklist:create') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => openCreate(2, category.id)}
                            >
                              <Plus className="h-3 w-3" /> Item
                            </Button>
                          )}
                          {hasPermission('inspection-checklist:update') && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(category, 1)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {hasPermission('inspection-checklist:delete') && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openDelete(category)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {category.children && category.children.length > 0 && (
                        <div className="border-t border-border divide-y divide-border">
                          {category.children.map((leaf) => (
                            <div key={leaf.id} className="flex items-center justify-between px-3 py-1.5 pl-8 gap-2 bg-background hover:bg-muted/20">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground w-4 shrink-0">{leaf.code ?? ''}</span>
                                <span className="text-sm truncate">{leaf.name}</span>
                                {!leaf.isActive && (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-500 border-0 text-xs shrink-0">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {hasPermission('inspection-checklist:update') && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(leaf, 2)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                                {hasPermission('inspection-checklist:delete') && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => openDelete(leaf)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(!category.children || category.children.length === 0) && (
                        <p className="text-xs text-muted-foreground px-8 py-1.5 border-t border-border">No items yet</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-1">No categories yet</p>
                )}

                {hasPermission('inspection-checklist:create') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs gap-1 w-full"
                    onClick={() => openCreate(1, template.id)}
                  >
                    <Plus className="h-3 w-3" /> Add Category
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'description',
      header: 'Description',
      cell: (template: InspectionChecklistDTO) => (
        <span className="text-sm text-muted-foreground line-clamp-2">{template.description || '-'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (template: InspectionChecklistDTO) => (
        <Badge
          variant="outline"
          className={`border-0 ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
        >
          {template.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (template: InspectionChecklistDTO) => (
        <DropdownMenu
          open={openDropdownId === template.id}
          onOpenChange={(open) => setOpenDropdownId(open ? template.id : null)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasPermission('inspection-checklist:create') && (
              <DropdownMenuItem onClick={() => openCreate(1, template.id)}>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </DropdownMenuItem>
            )}
            {hasPermission('inspection-checklist:update') && (
              <DropdownMenuItem onClick={() => openEdit(template, 0)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Template
              </DropdownMenuItem>
            )}
            {(hasPermission('inspection-checklist:update') || hasPermission('inspection-checklist:create')) && hasPermission('inspection-checklist:delete') && (
              <DropdownMenuSeparator />
            )}
            {hasPermission('inspection-checklist:delete') && (
              <DropdownMenuItem
                onClick={() => openDelete(template)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const getFormTemplateId = (): string | undefined => {
    if (formState.depth === 0) return undefined;
    if (formState.depth === 1) return formState.parentId;
    if (formState.depth === 2) {
      for (const [rootId, tree] of Object.entries(treeData)) {
        const found = tree.children?.some((cat) => cat.id === formState.parentId);
        if (found) return rootId;
      }
    }
    return undefined;
  };

  return (
    <>
      <PageHeader
        title="Inspection Checklists"
        subtitle="Manage checklist templates and their categories and items"
        actions={
          <PermissionGuard permission="inspection-checklist:create">
            <ThemeButton onClick={() => openCreate(0)}>
              <Plus className="mr-2 h-4 w-4" /> Add Template
            </ThemeButton>
          </PermissionGuard>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={(val) => {
          setPageIndex(0);
          if (val === 'all') setActiveFilters({});
          else if (val === 'active') setActiveFilters({ status: { value: 'active', label: 'Active' } });
          else setActiveFilters({ status: { value: 'inactive', label: 'Inactive' } });
        }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={templates}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(total / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: (s) => { setLimit(s); setPageIndex(0); },
          total,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        sorting={sorting}
        onSortingChange={(next) => {
          setSorting(next ?? { id: 'order', desc: false });
          setPageIndex(0);
        }}
        onSearch={(term) => { setSearchTerm(term); setPageIndex(0); }}
        onApplyFilters={(filters: FilterValue[]) => {
          const next: Record<string, { value: any; label: string }> = {};
          filters.forEach((f) => {
            next[f.id] = {
              value: f.value,
              label: f.id === 'status' ? (f.value === 'active' ? 'Active' : 'Inactive') : String(f.value),
            };
          });
          setActiveFilters(next);
          setPageIndex(0);
        }}
      />

      <InspectionChecklistForm
        open={formState.open}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open }))}
        depth={formState.depth}
        parentId={formState.parentId}
        initialData={formState.initialData}
        onSuccess={() => {
          if (formState.depth === 0) {
            fetchTemplates();
          } else {
            const rootId = formState.depth === 1
              ? formState.parentId
              : getFormTemplateId();
            if (rootId) {
              setExpandedIds((prev) => new Set(prev).add(rootId));
              refreshTree(rootId);
            }
          }
          setFormState(INITIAL_FORM);
        }}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((s) => ({ ...s, open }))}
        title="Delete Item"
        description={`Are you sure you want to delete "${deleteDialog.item?.name}"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}
