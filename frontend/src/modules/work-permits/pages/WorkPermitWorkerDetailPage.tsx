import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import { usePermissions } from '@/core/hooks/usePermissions';
import workPermitWorkerService from '../services/workPermitWorkerService';
import type { WorkPermitWorkerProfileDTO } from '../types/work-permit-worker-profile.types';

const WorkPermitWorkerDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [data, setData] = useState<WorkPermitWorkerProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    if (!hasPermission('user:read')) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const res = await workPermitWorkerService.getWorkPermitWorkerProfile(
          userId,
        );
        if (!cancelled) setData(res);
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            e &&
            typeof e === 'object' &&
            'response' in e &&
            e.response &&
            typeof e.response === 'object' &&
            'data' in e.response &&
            e.response.data &&
            typeof e.response.data === 'object' &&
            'message' in e.response.data
              ? String(
                  (e.response.data as { message?: string }).message ??
                    'Failed to load worker',
                )
              : 'Failed to load worker';
          toast.error(msg);
          setData(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, hasPermission]);

  if (!hasPermission('user:read')) {
    return (
      <>
        <PageHeader title="Worker" subtitle="Work permit assignments" />
        <p className="px-4 py-8 text-center text-muted-foreground">
          You do not have permission to view user details.
        </p>
      </>
    );
  }

  if (!userId) {
    return null;
  }

  const u = data?.user;
  const displayName = u
    ? `${u.firstName} ${u.lastName}`.trim() || u.email
    : '';

  return (
    <>
      <PageHeader
        title={isLoading ? 'Worker' : displayName || 'Worker'}
        subtitle="Profession, certificate, and health screening per work permit"
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/work-permits/workers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to workers
          </Button>
        }
      />

      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-8">
        {u && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Contractor user</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="font-medium">{u.email}</p>
              </div>
              {u.company && (
                <div>
                  <span className="text-muted-foreground">Company</span>
                  <p className="font-medium">{u.company.name}</p>
                </div>
              )}
              {u.role && (
                <div>
                  <span className="text-muted-foreground">Role</span>
                  <p className="font-medium">{u.role.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <p className="text-center text-muted-foreground">Loading…</p>
        )}

        {!isLoading && !data && hasPermission('user:read') && (
          <p className="text-center text-muted-foreground">
            Could not load this worker profile.
          </p>
        )}

        {!isLoading && data && data.assignments.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              This worker is not yet assigned on any work permit (or no permits
              match your company scope).
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          data?.assignments.map((a, idx) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  Work permit assignment {idx + 1}
                </CardTitle>
                <CardDescription>
                  {format(new Date(a.createdAt), 'PPp')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Permit</span>
                  <p className="font-medium">
                    <Link
                      to={`/work-permits/${a.workPermit.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {a.workPermit.code} — {a.workPermit.projectName}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {a.workPermit.status}
                  </p>
                  {a.workPermit.company && (
                    <p className="text-xs text-muted-foreground">
                      Permit company: {a.workPermit.company.name} (
                      {a.workPermit.company.code})
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">
                    Profession
                  </span>
                  <p className="font-medium">
                    {(() => {
                      const prof = a.profession ?? u?.profession;
                      return prof ?
                          <>
                            {prof.name}{' '}
                            <span className="text-muted-foreground">({prof.code})</span>
                          </>
                        : '—';
                    })()}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">
                    ID number
                  </span>
                  <p className="font-medium">
                    {a.idNumber?.trim() || u?.idNumber?.trim() || '—'}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">
                    Certificate
                  </span>
                  {a.certificateUrl ? (
                    <a
                      href={a.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Open file
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-muted-foreground">—</p>
                  )}
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">
                    Health declaration file
                  </span>
                  {a.healthDeclarationUrl ? (
                    <a
                      href={a.healthDeclarationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Open file
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-muted-foreground">—</p>
                  )}
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">
                    Linked health screening
                  </span>
                  {a.healthScreening ? (
                    <div className="space-y-1">
                      <p className="font-medium">
                        <Link
                          to={`/health-screenings/${a.healthScreening.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {a.healthScreening.quiz?.title ?? 'Health screening'}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {a.healthScreening.status}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">—</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </>
  );
};

export default WorkPermitWorkerDetailPage;
