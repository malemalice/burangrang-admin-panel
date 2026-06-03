import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, Pencil, Download, CheckCircle2, RotateCcw } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import { buildPdfOptions, generateTableAwarePdf } from '@/core/lib/pdfExport';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Label } from '@/core/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/core/components/ui/alert';
import { usePermissions } from '@/core/hooks/usePermissions';
import investigationReportsService from '../services/investigationReportsService';
import {
  FIXED_SIGNATORY_SLOTS,
  SIGNATORY_ROLE_LABELS,
  InvestigationCauseSectionEnum,
  InvestigationStatusEnum,
  type InvestigationCause,
  type InvestigationReport,
  type InvestigationSignatory,
} from '../types/investigation-report.types';
import InvestigationReportPDFTemplate from '../components/InvestigationReportPDFTemplate';
import {
  IncidentSectionA,
  IncidentSectionB,
  IncidentSectionC,
  IncidentSectionD,
  IncidentSectionE,
  IncidentSectionF,
} from '../components/incident-readonly';

const InvestigationReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('investigation-report:update');
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const { targetRef } = usePDF(
    buildPdfOptions({
      filename: `${report?.reportNumber.replace(/\//g, '-') ?? 'investigation-report'}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
    }),
  );

  const fetchReport = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await investigationReportsService.getById(id);
      setReport(data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setAccessDenied(true);
      } else {
        toast.error('Failed to load investigation report');
        navigate('/investigation-reports');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleExportPDF = async () => {
    if (!report) return;
    try {
      setIsExportingPDF(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await generateTableAwarePdf(
        targetRef,
        buildPdfOptions({
          filename: `${report.reportNumber.replace(/\//g, '-')}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
        }),
      );
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setIsMutating(true);
    try {
      await investigationReportsService.complete(id);
      toast.success('Report marked complete');
      await fetchReport();
    } catch {
      toast.error('Failed to mark complete');
    } finally {
      setIsMutating(false);
    }
  };

  const handleReopen = async () => {
    if (!id) return;
    setIsMutating(true);
    try {
      await investigationReportsService.reopen(id);
      toast.success('Report reopened');
      await fetchReport();
    } catch {
      toast.error('Failed to reopen');
    } finally {
      setIsMutating(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  if (accessDenied) {
    return (
      <div className="p-8 max-w-lg">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You do not have access to this record.</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  if (!report) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  const isDraft = report.status === InvestigationStatusEnum.DRAFT;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Investigation Report: ${report.reportNumber}`}
        subtitle={
          report.incident
            ? `Incident ${report.incident.code} — ${report.incident.subject}`
            : 'Incident details unavailable'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={isExportingPDF}>
              <Download className="mr-2 h-4 w-4" />
              {isExportingPDF ? 'Preparing PDF...' : 'Export PDF'}
            </Button>
            {isDraft && canEdit && (
              <>
                <Button onClick={() => navigate(`/investigation-reports/${report.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleComplete}
                  disabled={isMutating}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Complete
                </Button>
              </>
            )}
            {!isDraft && canEdit && (
              <Button variant="outline" onClick={handleReopen} disabled={isMutating}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reopen
              </Button>
            )}
          </div>
        }
      />

      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status</span>
              <Badge
                className={
                  isDraft
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-green-100 text-green-800'
                }
              >
                {isDraft ? 'Draft' : 'Complete'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Report Number</Label>
              <p>{report.reportNumber}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p>{format(new Date(report.createdAt), 'dd MMM yyyy HH:mm')}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created By</Label>
              <p>
                {report.creator
                  ? `${(report.creator as any).firstName ?? ''} ${(report.creator as any).lastName ?? ''}`.trim()
                  : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        {report.incident && (
          <IncidentSectionA
            incident={report.incident}
            reportNumber={report.reportNumber}
          />
        )}

        {/* A1 / A2 — Task & Equipment (investigation-specific) */}
        <Card>
          <CardHeader>
            <CardTitle>A1 / A2 — Task & Equipment</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Task Performed</Label>
              {report.taskBeingPerformed
                ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: report.taskBeingPerformed }} />
                : <p className="text-muted-foreground">—</p>}
            </div>
            <div>
              <Label className="text-muted-foreground">Equipment / Materials</Label>
              {report.equipmentUsed
                ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: report.equipmentUsed }} />
                : <p className="text-muted-foreground">—</p>}
            </div>
          </CardContent>
        </Card>

        {report.incident && (
          <>
            <IncidentSectionB
              incident={report.incident}
              bodyDiagramUrl={report.bodyDiagramUrl}
              bodyPartsSummary={report.bodyPartsSummary}
              injuryTypesSummary={report.injuryTypesSummary}
              mechanismsSummary={report.mechanismsSummary}
            />
            <IncidentSectionC incident={report.incident} />
            <IncidentSectionD incident={report.incident} />
            <IncidentSectionE incident={report.incident} />
            <IncidentSectionF incident={report.incident} />
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>G. Estimation Cost / Estimasi Kerugian</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <CostRow label="Medical Cost" value={report.cost?.medicalCost} />
            <CostRow label="Lost Time Cost" value={report.cost?.lostTimeCost} />
            <CostRow label="Damage Cost" value={report.cost?.damageCost} />
            <CostRow label="Repair Cost" value={report.cost?.repairCost} />
            <CostRow label="Compensation Cost" value={report.cost?.compensationCost} />
            <CostRow label="Other Cost" value={report.cost?.otherCost} />
            <div className="md:col-span-2 mt-2 border-t pt-2 flex items-center justify-between">
              <span className="font-medium">TOTAL</span>
              <span className="font-semibold">
                {report.cost?.isNotYetKnown
                  ? 'Rp. Not Yet Known (Belum diketahui)'
                  : `Rp. ${[
                      report.cost?.medicalCost,
                      report.cost?.lostTimeCost,
                      report.cost?.damageCost,
                      report.cost?.repairCost,
                      report.cost?.compensationCost,
                      report.cost?.otherCost,
                    ]
                      .reduce<number>((acc, v) => acc + (Number(v) || 0), 0)
                      .toLocaleString('id-ID')}`}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              H. Latent Failure / Kegagalan Terpendam (Indirect Cause)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <CauseMatrix
              causes={report.causes.filter(
                (c) =>
                  c.isSelected &&
                  c.section === InvestigationCauseSectionEnum.LATENT_FAILURE,
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              I. Active Failure / Kegagalan Aktif (Direct Cause)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <CauseMatrix
              causes={report.causes.filter(
                (c) =>
                  c.isSelected &&
                  c.section === InvestigationCauseSectionEnum.ACTIVE_FAILURE,
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>J. Remedial Action Plan / Rencana Tindakan Perbaikan</CardTitle>
          </CardHeader>
          <CardContent>
            {report.actionPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No action plans.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">No</th>
                    <th className="p-2 text-left">Action</th>
                    <th className="p-2 text-left">Responsible</th>
                    <th className="p-2 text-left">Target</th>
                    <th className="p-2 text-left">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {report.actionPlans.map((a, i) => {
                    const isOverdue =
                      !!a.targetDate &&
                      !a.verificationDate &&
                      new Date(a.targetDate) < new Date();
                    return (
                    <tr key={a.id} className={`border-t${isOverdue ? ' bg-destructive/10' : ''}`}>
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2 whitespace-pre-line">{a.actionPlan}</td>
                      <td className="p-2">{a.responsiblePerson ?? '—'}</td>
                      <td className="p-2">
                        {a.targetDate
                          ? format(new Date(a.targetDate), 'dd MMM yyyy')
                          : a.targetDateNotes ?? 'TBD'}
                      </td>
                      <td className="p-2">
                        {a.verificationDate
                          ? format(new Date(a.verificationDate), 'dd MMM yyyy')
                          : '—'}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>K. Signatures / Tanda tangan</CardTitle>
          </CardHeader>
          <CardContent>
            <SignatoriesTable signatories={report.signatories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>L. Health and Safety Comments / Komentar Health and Safety</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div>
              <Label className="text-muted-foreground">Health &amp; Safety Comments</Label>
              {report.hsComments
                ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: report.hsComments }} />
                : <p className="text-muted-foreground">—</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        ref={targetRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
        aria-hidden="true"
      >
        <InvestigationReportPDFTemplate report={report} />
      </div>
    </div>
  );
};

const CauseMatrix = ({ causes }: { causes: InvestigationCause[] }) => {
  if (causes.length === 0) {
    return <p className="text-sm text-muted-foreground">No causes selected.</p>;
  }

  // Group selected causes by tier1 → tier2 using snapshot fields
  const byTier1 = causes.reduce<Record<string, Record<string, InvestigationCause[]>>>(
    (acc, c) => {
      if (!acc[c.tier1]) acc[c.tier1] = {};
      if (!acc[c.tier1][c.tier2]) acc[c.tier1][c.tier2] = [];
      acc[c.tier1][c.tier2].push(c);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-4">
      {Object.entries(byTier1).map(([tier1, tier2Groups]) => (
        <div key={tier1} className="space-y-3">
          <div className="rounded-md bg-muted px-4 py-2">
            <p className="text-sm font-semibold">{tier1}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(tier2Groups).map(([tier2, items]) => (
              <div key={tier2} className="rounded-md border p-3 space-y-1.5">
                <p className="text-sm font-medium">{tier2}</p>
                <div className="space-y-1">
                  {items.map((c) => (
                    <div key={c.id} className="px-2 py-1">
                      <span className="text-sm">{c.causeName}</span>
                      {c.customNotes && (
                        <span className="text-xs text-muted-foreground"> — {c.customNotes}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const CostRow = ({ label, value }: { label: string; value?: number | null }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span>
      {value != null
        ? `Rp. ${Number(value).toLocaleString('id-ID')}`
        : '—'}
    </span>
  </div>
);

const SignatoriesTable = ({ signatories }: { signatories: InvestigationSignatory[] }) => {
  // Merge saved signatories with fixed slots so every slot is always rendered.
  const rows = FIXED_SIGNATORY_SLOTS.map((role) => {
    const saved = signatories.find((s) => s.signatoryRole === role);
    return { role, saved };
  });

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left p-2 font-medium">Investigator Team / Tim Penyidik</th>
            <th className="text-left p-2 font-medium">Name / Nama</th>
            <th className="text-left p-2 font-medium">Signature / Tanda Tangan</th>
            <th className="text-left p-2 font-medium">Date / Tanggal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ role, saved }) => {
            const label = SIGNATORY_ROLE_LABELS[role];
            return (
              <tr key={role} className="border-b last:border-0">
                <td className="p-2">
                  <p className="font-medium">{label.en} / {label.id}</p>
                  {saved?.roleName && (
                    <p className="text-xs text-muted-foreground">{saved.roleName}</p>
                  )}
                </td>
                <td className="p-2">{saved?.name ?? '—'}</td>
                <td className="p-2 h-12" />
                <td className="p-2">
                  {saved?.signedAt ? format(new Date(saved.signedAt), 'dd MMM yyyy') : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InvestigationReportDetailPage;
