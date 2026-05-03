import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Input } from '@/core/components/ui/input';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
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
  const [tree, setTree] = useState<InspectionChecklistDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: InspectionChecklistDTO | null }>({ open: false, item: null });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await inspectionChecklistService.getTree();
      setTree(data);
    } catch {
      toast.error('Failed to load inspection checklists');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allCategories = tree.flatMap((checklist) => checklist.children ?? []);

  const filteredCategories = searchTerm
    ? allCategories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cat.code ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.children?.some(
            (item) =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (item.code ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      )
    : allCategories;

  const openCreate = (depth: Depth, parentId?: string) => {
    setFormState({ open: true, depth, parentId });
  };

  const openEdit = (item: InspectionChecklistDTO, depth: Depth) => {
    setFormState({ open: true, depth, initialData: item });
  };

  const openDelete = (item: InspectionChecklistDTO) => {
    setDeleteDialog({ open: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item) return;
    try {
      await inspectionChecklistService.delete(deleteDialog.item.id);
      toast.success(`"${deleteDialog.item.name}" deleted`);
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to delete'));
    } finally {
      setDeleteDialog({ open: false, item: null });
    }
  };

  return (
    <>
      <PageHeader
        title="Inspection Checklists"
        subtitle="Manage inspection checklists and their categories and items"
        actions={
          <div className="flex items-center gap-2">
            <PermissionGuard permission="inspection-checklist:create">
              <Button variant="outline" onClick={() => openCreate(0)}>
                <Plus className="mr-2 h-4 w-4" /> Add Checklist
              </Button>
              <ThemeButton onClick={() => openCreate(1)}>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </ThemeButton>
            </PermissionGuard>
          </div>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search categories or items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          {searchTerm ? 'No results found' : 'No categories yet'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((category) => (
            <div key={category.id} className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center px-4 py-3 bg-muted/30 gap-3">
                <span className="text-sm font-semibold text-muted-foreground w-6 shrink-0">
                  {category.code ?? ''}
                </span>
                <span className="font-semibold flex-1">{category.name}</span>
                {!category.isActive && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-500 border-0 text-xs shrink-0">
                    Inactive
                  </Badge>
                )}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(category, 1)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {hasPermission('inspection-checklist:delete') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => openDelete(category)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {category.children && category.children.length > 0 ? (
                <div className="divide-y divide-border">
                  {category.children.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center px-4 py-2 pl-10 gap-3 bg-background hover:bg-muted/20"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{item.code ?? ''}</span>
                      <span className="text-sm flex-1">{item.name}</span>
                      {!item.isActive && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-500 border-0 text-xs shrink-0">
                          Inactive
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 shrink-0">
                        {hasPermission('inspection-checklist:update') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openEdit(item, 2)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {hasPermission('inspection-checklist:delete') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => openDelete(item)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground px-10 py-2 border-t border-border">
                  No items yet
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <InspectionChecklistForm
        open={formState.open}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open }))}
        depth={formState.depth}
        parentId={formState.parentId}
        initialData={formState.initialData}
        checklists={tree}
        onSuccess={() => {
          fetchData();
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
