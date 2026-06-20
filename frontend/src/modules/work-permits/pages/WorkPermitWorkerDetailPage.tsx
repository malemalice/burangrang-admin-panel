import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Loader2, Upload, User } from 'lucide-react';
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
import uploadService from '@/modules/uploads/services/uploadService';
import workPermitWorkerService from '../services/workPermitWorkerService';
import type { WorkPermitWorkerProfileDTO } from '../types/work-permit-worker-profile.types';
import healthScreeningService from '@/modules/health-screenings/services/healthScreeningService';
import type { HealthScreeningListItem } from '@/modules/health-screenings/types/healthScreening.types';

const WorkPermitWorkerDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [data, setData] = useState<WorkPermitWorkerProfileDTO | null>(null);
  const [healthScreenings, setHealthScreenings] = useState<HealthScreeningListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const certFileInputRef = useRef<HTMLInputElement>(null);

  const canReadProfile = hasPermission('user:read');
  const canUploadCertificate =
    hasPermission('user:read') && hasPermission('upload:create');

  const loadProfile = useCallback(async () => {
    if (!userId || !canReadProfile) return;
    const [profile, screenings] = await Promise.all([
      workPermitWorkerService.getWorkPermitWorkerProfile(userId),
      healthScreeningService.list({ userId, page: 1, limit: 50 }),
    ]);
    setData(profile);
    setHealthScreenings(screenings.data);
  }, [userId, canReadProfile]);

  useEffect(() => {
    if (!userId) return;
    if (!canReadProfile) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        await loadProfile();
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
  }, [userId, canReadProfile, loadProfile]);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const category = await uploadService.getCategoryByName('work-permit-documents');
        if (category) setCategoryId(category.id);
        else toast.error('File category for work permit documents not found');
      } catch {
        toast.error('Failed to resolve upload category');
      }
    };
    void loadCategory();
  }, []);

  const workerDocs = data
    ? (data.workerDocuments ?? {
        certificateUrl: data.assignments[0]?.certificateUrl ?? null,
        healthDeclarationUrl: data.assignments[0]?.healthDeclarationUrl ?? null,
      })
    : null;

  const relatedPermits = data
    ? Object.values(
        data.assignments.reduce(
          (acc, a) => {
            acc[a.workPermit.id] = a.workPermit;
            return acc;
          },
          {} as Record<
            string,
            {
              id: string;
              code: string;
              projectName: string;
              status: string;
              company?: { id: string; name: string; code: string };
            }
          >,
        ),
      ).sort((a, b) => a.code.localeCompare(b.code))
    : [];

  const handleCertificateFile = async (file: File | undefined) => {
    if (!file || !userId) return;
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or image files.');
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }
    if (!categoryId) {
      toast.error('File category not found. Please refresh the page.');
      return;
    }
    setIsUploadingCert(true);
    try {
      const response = await uploadService.uploadFile(file, categoryId, false);
      const fileUrl =
        response.downloadUrl ||
        (response.isPublic
          ? uploadService.getPublicFileUrl(response.id)
          : uploadService.getPrivateFileUrl(response.accessToken || response.id));
      await workPermitWorkerService.updateWorkerDocuments(userId, {
        certificateUrl: fileUrl,
      });
      toast.success('Certificate saved');
      await loadProfile();
    } catch (e: unknown) {
      const maybeAxios = e as { response?: { data?: { message?: string } } };
      toast.error(maybeAxios.response?.data?.message ?? 'Failed to upload certificate');
    } finally {
      setIsUploadingCert(false);
      if (certFileInputRef.current) certFileInputRef.current.value = '';
    }
  };

  const handleClearCertificate = async () => {
    if (!userId) return;
    setIsUploadingCert(true);
    try {
      await workPermitWorkerService.updateWorkerDocuments(userId, { certificateUrl: '' });
      toast.success('Certificate removed');
      await loadProfile();
    } catch (e: unknown) {
      const maybeAxios = e as { response?: { data?: { message?: string } } };
      toast.error(maybeAxios.response?.data?.message ?? 'Failed to remove certificate');
    } finally {
      setIsUploadingCert(false);
    }
  };

  if (!canReadProfile) {
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
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
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

              <div className="sm:col-span-2 border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Documents</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Certificate</span>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {workerDocs?.certificateUrl ? (
                        <a
                          href={workerDocs.certificateUrl}
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
                      {canUploadCertificate && (
                        <>
                          <input
                            ref={certFileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => void handleCertificateFile(e.target.files?.[0])}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploadingCert || !categoryId}
                            onClick={() => certFileInputRef.current?.click()}
                          >
                            {isUploadingCert ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="mr-2 h-4 w-4" />
                            )}
                            {workerDocs?.certificateUrl ? 'Replace' : 'Upload'}
                          </Button>
                          {workerDocs?.certificateUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              disabled={isUploadingCert}
                              onClick={() => void handleClearCertificate()}
                            >
                              Remove
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload PDF, DOC, DOCX, or image (max 10MB). Shown read-only on work permits.
                    </p>
                  </div>
                  {/* <div>
                    <span className="text-muted-foreground">Health declaration file</span>
                    {workerDocs?.healthDeclarationUrl ? (
                      <div className="mt-1">
                        <a
                          href={workerDocs.healthDeclarationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          Open file
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <p className="mt-1 text-muted-foreground">—</p>
                    )}
                  </div> */}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <p className="text-center text-muted-foreground">Loading…</p>
        )}

        {!isLoading && !data && canReadProfile && (
          <p className="text-center text-muted-foreground">
            Could not load this worker profile.
          </p>
        )}

        {!isLoading && data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Health declaration history</CardTitle>
              <CardDescription>
                All health declarations submitted by this worker
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthScreenings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No health declarations submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {healthScreenings.map((hs) => (
                    <div
                      key={hs.id}
                      className="flex flex-col gap-1 rounded-md border p-3 text-sm sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-medium">
                          <Link
                            to={`/health-screenings/${hs.id}`}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {hs.quiz?.title ?? 'Health declaration'}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted:{' '}
                          {hs.declarationTermsAcceptedAt
                            ? format(new Date(hs.declarationTermsAcceptedAt), 'PPp')
                            : format(new Date(hs.createdAt), 'PPp')}
                        </p>
                        {hs.consumedByWorkPermitCode && (
                          <p className="text-xs text-muted-foreground">
                            Linked to permit: {hs.consumedByWorkPermitCode}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 self-start rounded px-2 py-0.5 text-xs font-medium ${
                          hs.status === 'DONE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : hs.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {hs.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isLoading && data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related work permits</CardTitle>
              <CardDescription>
                Permits where this worker is assigned (within your scope)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedPermits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No related work permits found in your scope yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {relatedPermits.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          <Link
                            to={`/work-permits/${p.id}`}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {p.code} — {p.projectName}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {p.status}
                          {p.company ? ` • ${p.company.name} (${p.company.code})` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
