import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Users, Plus, Eye, Copy, Link2, Loader2 } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useAuth } from '@/core/lib/auth';
import type { User } from '@/core/lib/types';
import companyService from '@/modules/master-data/services/companyService';
import type { CompanyDTO } from '@/modules/master-data/types/master-data.types';
import healthScreeningService from '@/modules/health-screenings/services/healthScreeningService';
import { useWorkPermitWorkers } from '../hooks/useWorkPermitWorkers';

function getAuthRoleName(role: { name: string } | string | undefined): string {
  if (!role) return '';
  return typeof role === 'string' ? role : role.name;
}

const WorkPermitWorkersPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { user: authUser } = useAuth();
  const { workers, total, isLoading, fetchWorkers } = useWorkPermitWorkers();

  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilterId, setCompanyFilterId] = useState('');
  const [companyOptions, setCompanyOptions] = useState<{ value: string; label: string }[]>([]);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkExpiresAt, setLinkExpiresAt] = useState('');
  const [generatingUserId, setGeneratingUserId] = useState<string | null>(null);

  const roleName = getAuthRoleName(authUser?.role);
  const isSuperAdmin = roleName === 'Super Admin';
  const hasCompany = Boolean(authUser?.companyId);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await companyService.getCompanies({
          page: 1,
          limit: 500,
          options: true,
        });
        if (cancelled) return;
        setCompanyOptions(
          res.data.map((c: CompanyDTO) => ({
            value: c.id,
            label: c.name,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const loadData = useCallback(async () => {
    const trimmed = searchTerm.trim();
    await fetchWorkers({
      page: pageIndex + 1,
      limit,
      search: trimmed.length > 0 ? trimmed : undefined,
      companyIdFilter:
        isSuperAdmin && companyFilterId ? companyFilterId : undefined,
    });
  }, [
    fetchWorkers,
    pageIndex,
    limit,
    searchTerm,
    isSuperAdmin,
    companyFilterId,
  ]);

  useEffect(() => {
    if (!hasPermission('user:list')) return;
    if (!isSuperAdmin && !hasCompany) return;
    void loadData();
  }, [loadData, hasPermission, isSuperAdmin, hasCompany]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  }, []);

  const pageCount = Math.max(1, Math.ceil(total / limit));

  const handleGenerateHealthLink = useCallback(async (row: User) => {
    setGeneratingUserId(row.id);
    try {
      const res = await healthScreeningService.generatePublicLink({
        userId: row.id,
      });
      setGeneratedLink(res.linkUrl);
      setLinkExpiresAt(res.expiresAt);
      setLinkDialogOpen(true);
      try {
        await navigator.clipboard.writeText(res.linkUrl);
        toast.success('Link copied to clipboard');
      } catch {
        toast.success('Link generated — copy it from the dialog');
      }
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === 'object' &&
        'response' in e &&
        e.response &&
        typeof e.response === 'object' &&
        'data' in e.response &&
        e.response.data &&
        typeof e.response.data === 'object' &&
        'message' in e.response.data &&
        typeof (e.response.data as { message: unknown }).message === 'string'
          ? (e.response.data as { message: string }).message
          : e instanceof Error
            ? e.message
            : 'Failed to generate link';
      toast.error(msg);
    } finally {
      setGeneratingUserId(null);
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: 'Worker',
        cell: (row: User) => (
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">{row.name}</div>
              <div className="text-sm text-muted-foreground">{row.email}</div>
            </div>
          </div>
        ),
        isSortable: false,
      },
      ...(isSuperAdmin
        ? [
            {
              id: 'company',
              header: 'Company',
              cell: (row: User) => (
                <span className="text-muted-foreground">
                  {row.company ?? '—'}
                </span>
              ),
              isSortable: false,
            },
          ]
        : []),
      {
        id: 'profession',
        header: 'Profession',
        cell: (row: User) => (
          <span className="text-sm text-muted-foreground">
            {row.profession ?? '—'}
          </span>
        ),
        isSortable: false,
      },
      {
        id: 'role',
        header: 'Role',
        cell: (row: User) => (
          <span className="text-sm">{row.role ?? '—'}</span>
        ),
        isSortable: false,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row: User) => (
          <Badge
            variant="outline"
            className={
              row.isActive
                ? 'border-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                : 'border-0 bg-muted text-muted-foreground'
            }
          >
            {row.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
        isSortable: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (row: User) =>
          hasPermission('user:read') ? (
            <div className="flex flex-wrap items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => navigate(`/work-permits/workers/${row.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
              {hasPermission('health-screening:start') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  disabled={generatingUserId === row.id}
                  onClick={() => void handleGenerateHealthLink(row)}
                >
                  {generatingUserId === row.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  Health link
                </Button>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        isSortable: false,
      },
    ],
    [isSuperAdmin, hasPermission, navigate, generatingUserId, handleGenerateHealthLink],
  );

  if (!hasPermission('user:list')) {
    return (
      <>
        <PageHeader
          title="Workers"
          subtitle="Contractor accounts for work permits"
        />
        <p className="px-4 py-8 text-center text-muted-foreground">
          You do not have permission to view users.
        </p>
      </>
    );
  }

  if (!isSuperAdmin && !hasCompany) {
    return (
      <>
        <PageHeader
          title="Workers"
          subtitle="Contractor accounts for work permits"
        />
        <p className="px-4 py-8 text-center text-muted-foreground">
          You must be assigned to a company to view workers.
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Workers"
        subtitle="Users with the Contractor role for your organization (Super Admin can filter by company)"
        actions={
          <PermissionGuard permission="user:create">
            <Button onClick={() => navigate('/work-permits/workers/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add worker
            </Button>
          </PermissionGuard>
        }
      />

      <div className="mx-auto max-w-6xl space-y-4 px-4 pb-8">
        {isSuperAdmin && (
          <div className="max-w-sm space-y-2">
            <Label htmlFor="worker-company-filter">Company</Label>
            <SearchableSelect
              id="worker-company-filter"
              options={companyOptions}
              value={companyFilterId}
              onValueChange={(v) => {
                setCompanyFilterId(v === 'none' ? '' : v);
                setPageIndex(0);
              }}
              placeholder="All companies"
              includeNone
              emptyText="No companies found"
            />
          </div>
        )}

        <DataTable
          columns={columns}
          data={workers}
          isLoading={isLoading}
          pagination={{
            pageIndex,
            limit,
            pageCount,
            onPageChange: setPageIndex,
            onPageSizeChange: setLimit,
            total,
          }}
          searchValue={searchTerm}
          onSearch={handleSearch}
          searchPlaceholder="Search name or email…"
        />

        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Health screening link</DialogTitle>
              <DialogDescription>
                Share this link with the worker. It works without login and expires after 24 hours.
                {linkExpiresAt && (
                  <span className="mt-2 block text-foreground">
                    Expires:{' '}
                    {new Date(linkExpiresAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="health-screening-generated-url">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="health-screening-generated-url"
                  readOnly
                  value={generatedLink}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    void navigator.clipboard.writeText(generatedLink).then(
                      () => toast.success('Copied'),
                      () => toast.error('Could not copy'),
                    );
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setLinkDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default WorkPermitWorkersPage;
