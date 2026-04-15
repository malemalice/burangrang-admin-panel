import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, ClipboardList, Loader2, FileText, Paperclip, Link2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import workClassificationService from '../services/workClassificationService';
import { WorkClassification } from '../types/work-classification.types';
import { usePermissions } from '@/core/hooks/usePermissions';
import riskMitigationService, {
  type RiskMitigation,
} from '@/modules/risk-assessment/services/riskMitigationService';

const WorkClassificationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [row, setRow] = useState<WorkClassification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mitigationsByRiskId, setMitigationsByRiskId] = useState<Record<string, RiskMitigation[]>>(
    {},
  );
  const [mitigationsLoadingByRiskId, setMitigationsLoadingByRiskId] = useState<
    Record<string, boolean>
  >({});
  const [mitigationsErrorByRiskId, setMitigationsErrorByRiskId] = useState<
    Record<string, string | undefined>
  >({});
  const isMountedRef = useRef(true);
  const mitigationsInFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const data = await workClassificationService.getWorkClassificationById(id);
        setRow(data);
      } catch (error: unknown) {
        console.error(error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load work classification';
        toast.error(errorMessage);
        navigate('/master/work-classifications');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const canEdit = hasPermission('work-permit:update');

  const riskEquipmentRowsSorted = useMemo(() => {
    const rows = row?.riskEquipmentRows ?? [];
    return rows
      .filter((r) => !!r?.risk && !!r?.safetyEquipment)
      .slice()
      .sort((a, b) => a.order - b.order);
  }, [row?.riskEquipmentRows]);

  const distinctRiskIds = useMemo(() => {
    const ids = riskEquipmentRowsSorted
      .map((r) => r.risk?.id)
      .filter((rid): rid is string => !!rid);
    return Array.from(new Set(ids));
  }, [riskEquipmentRowsSorted]);

  useEffect(() => {
    if (distinctRiskIds.length === 0) return;

    const loadMitigations = async (riskId: string) => {
      mitigationsInFlightRef.current.add(riskId);
      try {
        setMitigationsLoadingByRiskId((prev) => ({ ...prev, [riskId]: true }));
        setMitigationsErrorByRiskId((prev) => ({ ...prev, [riskId]: undefined }));

        const mitigations = await riskMitigationService.getByRiskId(riskId);
        if (!isMountedRef.current) return;
        setMitigationsByRiskId((prev) => ({ ...prev, [riskId]: mitigations }));
      } catch (e) {
        console.error(e);
        if (!isMountedRef.current) return;
        setMitigationsErrorByRiskId((prev) => ({
          ...prev,
          [riskId]: 'Failed to load mitigation information',
        }));
        setMitigationsByRiskId((prev) => ({ ...prev, [riskId]: [] }));
      } finally {
        mitigationsInFlightRef.current.delete(riskId);
        if (!isMountedRef.current) return;
        setMitigationsLoadingByRiskId((prev) => ({ ...prev, [riskId]: false }));
      }
    };

    distinctRiskIds.forEach((riskId) => {
      if (mitigationsByRiskId[riskId] !== undefined) return;
      if (mitigationsInFlightRef.current.has(riskId)) return;
      void loadMitigations(riskId);
    });
  }, [distinctRiskIds, mitigationsByRiskId]);

  const getCombinedMitigationText = (mitigations: RiskMitigation[]) => {
    const parts = mitigations.flatMap((m) => {
      const items: Array<{ label: string; value: string }> = [];
      if (m.eliminate?.trim()) items.push({ label: 'Eliminate', value: m.eliminate });
      if (m.transfer?.trim()) items.push({ label: 'Transfer', value: m.transfer });
      if (m.reduce?.trim()) items.push({ label: 'Reduce', value: m.reduce });
      if (m.accept?.trim()) items.push({ label: 'Accept', value: m.accept });
      return items;
    });

    return parts.map((p) => `${p.label}\n${p.value}`).join('\n\n');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="py-12 text-center">
        <h2 className="mb-2 text-xl font-semibold">Not found</h2>
        <Button onClick={() => navigate('/master/work-classifications')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={row.name}
        subtitle={`Code: ${row.code}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/master/work-classifications')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {canEdit && (
              <Button
                onClick={() => navigate(`/master/work-classifications/${row.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                variant="outline"
                className={
                  row.isActive
                    ? 'border-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                    : 'border-0 bg-muted'
                }
              >
                {row.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {row.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1 whitespace-pre-wrap">{row.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <div>Created: {formatDateTime(row.createdAt)}</div>
              <div>Updated: {formatDateTime(row.updatedAt)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Safety guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {row.safetyGuideline ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none [&_table]:w-full [&_td]:border [&_th]:border"
                // eslint-disable-next-line react/no-danger -- trusted admin-authored HTML from TipTap
                dangerouslySetInnerHTML={{ __html: row.safetyGuideline }}
              />
            ) : (
              <p className="text-muted-foreground">No safety guidelines defined.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5" />
              Risk mitigation rows
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskEquipmentRowsSorted.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Risk</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Safety equipment</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Mitigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskEquipmentRowsSorted.map((r) => {
                      const riskId = r.risk?.id || '';
                      const isMitigationLoading = !!mitigationsLoadingByRiskId[riskId];
                      const mitigationError = mitigationsErrorByRiskId[riskId];
                      const mitigations = mitigationsByRiskId[riskId] ?? [];
                      const combinedText = getCombinedMitigationText(mitigations);

                      return (
                        <tr key={r.id} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 align-top whitespace-pre-wrap">
                            {r.risk?.name ? (
                              <>
                                {r.risk.name}{' '}
                                <span className="text-muted-foreground">({r.risk.code})</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 align-top whitespace-pre-wrap">
                            {r.safetyEquipment?.name ? (
                              <>
                                {r.safetyEquipment.name}{' '}
                                <span className="text-muted-foreground">({r.safetyEquipment.code})</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            <div className="mt-1 text-xs text-muted-foreground">
                              Category: {r.safetyEquipment?.category ?? '—'}
                              {r.safetyEquipment?.safetyEquipmentType?.name
                                ? ` • Type: ${r.safetyEquipment.safetyEquipmentType.name}`
                                : ''}
                              {r.safetyEquipment?.size ? ` • Size: ${r.safetyEquipment.size}` : ''}
                            </div>
                          </td>
                          <td className="py-3 pr-4 align-top whitespace-pre-wrap">
                            {!riskId ? (
                              <span className="text-muted-foreground">—</span>
                            ) : isMitigationLoading ? (
                              <span className="text-muted-foreground">Loading…</span>
                            ) : mitigationError ? (
                              <span className="text-destructive">{mitigationError}</span>
                            ) : combinedText.length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className="text-muted-foreground">{combinedText}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No rows defined.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Paperclip className="h-5 w-5" />
              Attached documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {row.attachments && row.attachments.length > 0 ? (
              <ul className="space-y-3">
                {row.attachments
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((att) => (
                    <li key={att.id} className="rounded-lg border p-3">
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {att.fileName}
                      </a>
                      {att.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{att.description}</p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No documents attached.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default WorkClassificationDetailPage;
