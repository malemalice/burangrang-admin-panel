import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Input } from '@/core/components/ui/input';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/core/components/ui/tabs';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
import hfacsNodeService from '../../services/hfacsNodeService';
import type {
  HfacsNodeDTO,
  HfacsSection,
} from '../../types/master-data.types';
import HfacsNodeForm from './HfacsNodeForm';

type Depth = 0 | 1 | 2;

interface FormState {
  open: boolean;
  depth: Depth;
  section: HfacsSection;
  parentId?: string;
  initialData?: HfacsNodeDTO;
}

const SECTION_LABEL: Record<HfacsSection, { title: string; subtitle: string }> = {
  LATENT_FAILURE: {
    title: 'Section H — Latent Failure (Indirect Cause)',
    subtitle: 'Organizational, supervisory and precondition causes',
  },
  ACTIVE_FAILURE: {
    title: 'Section I — Active Failure (Direct Cause)',
    subtitle: 'Unsafe acts performed by individuals',
  },
};

const matchesSearch = (node: HfacsNodeDTO, term: string): boolean => {
  if (!term) return true;
  const t = term.toLowerCase();
  const self =
    node.labelEn.toLowerCase().includes(t) ||
    node.labelId.toLowerCase().includes(t) ||
    (node.code ?? '').toLowerCase().includes(t);
  if (self) return true;
  return (node.children ?? []).some((c) => matchesSearch(c, t));
};

export default function HfacsNodesPage() {
  const { hasPermission } = usePermissions();
  const [tree, setTree] = useState<HfacsNodeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<HfacsSection>('LATENT_FAILURE');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: HfacsNodeDTO | null;
  }>({ open: false, item: null });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await hfacsNodeService.getTree();
      setTree(data);
    } catch {
      toast.error('Failed to load HFACS catalogue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sectionTier1s = useMemo(
    () => tree.filter((n) => n.section === activeSection),
    [tree, activeSection],
  );

  const filteredTier1s = useMemo(() => {
    if (!searchTerm) return sectionTier1s;
    return sectionTier1s.filter((t1) => matchesSearch(t1, searchTerm));
  }, [sectionTier1s, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = (depth: Depth, section: HfacsSection, parentId?: string) => {
    setFormState({ open: true, depth, section, parentId });
  };

  const openEdit = (item: HfacsNodeDTO) => {
    setFormState({
      open: true,
      depth: item.depth as Depth,
      section: item.section,
      parentId: item.parentId ?? undefined,
      initialData: item,
    });
  };

  const openDelete = (item: HfacsNodeDTO) => {
    setDeleteDialog({ open: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item) return;
    try {
      await hfacsNodeService.delete(deleteDialog.item.id);
      toast.success(`"${deleteDialog.item.labelEn}" deleted`);
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to delete'),
      );
    } finally {
      setDeleteDialog({ open: false, item: null });
    }
  };

  const renderTier2 = (t2: HfacsNodeDTO) => {
    const isOpen = expanded.has(t2.id) || !!searchTerm;
    const items = t2.children ?? [];
    return (
      <div key={t2.id} className="border-t border-border">
        <div className="flex items-center px-4 py-2 pl-8 gap-3 bg-background hover:bg-muted/20">
          <button
            type="button"
            onClick={() => toggleExpand(t2.id)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
          <span className="text-sm font-medium flex-1">
            {t2.labelEn}
            <span className="text-muted-foreground font-normal"> — {t2.labelId}</span>
          </span>
          {!t2.isActive && (
            <Badge
              variant="outline"
              className="bg-gray-100 text-gray-500 border-0 text-xs shrink-0"
            >
              Inactive
            </Badge>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {hasPermission('hfacs-node:create') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => openCreate(2, t2.section, t2.id)}
              >
                <Plus className="h-3 w-3" /> Item
              </Button>
            )}
            {hasPermission('hfacs-node:update') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openEdit(t2)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            {hasPermission('hfacs-node:delete') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => openDelete(t2)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isOpen && (
          <>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground px-12 py-2">
                No items yet
              </p>
            ) : (
              <div className="divide-y divide-border">
                {items
                  .filter((it) => matchesSearch(it, searchTerm))
                  .map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center px-4 py-2 pl-14 gap-3 bg-background hover:bg-muted/20"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground w-16 shrink-0 font-mono">
                        {it.code ?? '—'}
                      </span>
                      <span className="text-sm flex-1">
                        {it.labelEn}
                        <span className="text-muted-foreground"> — {it.labelId}</span>
                      </span>
                      {it.isOther && (
                        <Badge
                          variant="outline"
                          className="bg-amber-100 text-amber-800 border-0 text-xs shrink-0"
                        >
                          Others
                        </Badge>
                      )}
                      {!it.isActive && (
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-500 border-0 text-xs shrink-0"
                        >
                          Inactive
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 shrink-0">
                        {hasPermission('hfacs-node:update') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openEdit(it)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {hasPermission('hfacs-node:delete') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => openDelete(it)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderTier1 = (t1: HfacsNodeDTO) => {
    const isOpen = expanded.has(t1.id) || !!searchTerm;
    const tier2s = (t1.children ?? []).filter((c) =>
      matchesSearch(c, searchTerm),
    );
    return (
      <div
        key={t1.id}
        className="rounded-lg border border-border overflow-hidden"
      >
        <div className="flex items-center px-4 py-3 bg-muted/30 gap-3">
          <button
            type="button"
            onClick={() => toggleExpand(t1.id)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          <span className="font-semibold flex-1">
            {t1.labelEn}
            <span className="text-muted-foreground font-normal"> — {t1.labelId}</span>
          </span>
          {!t1.isActive && (
            <Badge
              variant="outline"
              className="bg-gray-100 text-gray-500 border-0 text-xs shrink-0"
            >
              Inactive
            </Badge>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {hasPermission('hfacs-node:create') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => openCreate(1, t1.section, t1.id)}
              >
                <Plus className="h-3 w-3" /> Sub-category
              </Button>
            )}
            {hasPermission('hfacs-node:update') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openEdit(t1)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            {hasPermission('hfacs-node:delete') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => openDelete(t1)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isOpen && (
          <>
            {tier2s.length === 0 ? (
              <p className="text-xs text-muted-foreground px-10 py-2 border-t border-border">
                No sub-categories yet
              </p>
            ) : (
              tier2s.map(renderTier2)
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="HFACS Catalogue"
        subtitle="Manage Sections H & I cause tree used by Investigation Reports"
        actions={
          <div className="flex items-center gap-2">
            <PermissionGuard permission="hfacs-node:create">
              <ThemeButton
                onClick={() => openCreate(0, activeSection)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </ThemeButton>
            </PermissionGuard>
          </div>
        }
      />

      <Tabs
        value={activeSection}
        onValueChange={(v) => setActiveSection(v as HfacsSection)}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="LATENT_FAILURE">Section H — Latent Failure</TabsTrigger>
          <TabsTrigger value="ACTIVE_FAILURE">Section I — Active Failure</TabsTrigger>
        </TabsList>
        <TabsContent value={activeSection} className="mt-3">
          <p className="text-sm text-muted-foreground">
            {SECTION_LABEL[activeSection].subtitle}
          </p>
        </TabsContent>
      </Tabs>

      <div className="mb-4">
        <Input
          placeholder="Search labels or codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading...
        </div>
      ) : filteredTier1s.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          {searchTerm ? 'No results found' : 'No categories yet'}
        </div>
      ) : (
        <div className="space-y-3">{filteredTier1s.map(renderTier1)}</div>
      )}

      {formState && (
        <HfacsNodeForm
          open={formState.open}
          onOpenChange={(open) =>
            setFormState((s) => (s ? { ...s, open } : null))
          }
          depth={formState.depth}
          section={formState.section}
          parentId={formState.parentId}
          initialData={formState.initialData}
          onSuccess={() => {
            fetchData();
            setFormState(null);
          }}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((s) => ({ ...s, open }))
        }
        title="Delete HFACS Node"
        description={`Are you sure you want to delete "${deleteDialog.item?.labelEn}"? Historical investigation reports keep their snapshot of this label and remain unaffected.`}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}
