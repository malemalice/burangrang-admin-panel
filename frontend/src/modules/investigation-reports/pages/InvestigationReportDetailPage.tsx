import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, Pencil, Download, CheckCircle2, RotateCcw } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Label } from '@/core/components/ui/label';
import investigationReportsService from '../services/investigationReportsService';
import {
  InvestigationStatusEnum,
  type InvestigationReport,
} from '../types/investigation-report.types';
import InvestigationReportPDFTemplate from '../components/InvestigationReportPDFTemplate';

const InvestigationReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const { toPDF, targetRef } = usePDF({
    filename: `${report?.reportNumber.replace(/\//g, '-') ?? 'investigation-report'}.pdf`,
  });

  const fetchReport = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await investigationReportsService.getById(id);
      setReport(data);
    } catch {
      toast.error('Failed to load investigation report');
      navigate('/investigation-reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  if (isLoading || !report) {
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
            <Button variant="outline" onClick={() => toPDF()}>
              <Download className="mr-2 h-4 w-4" /> Export PDF
            </Button>
            {isDraft ? (
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
            ) : (
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
          <Card>
            <CardHeader>
              <CardTitle>Incident Summary (Sections A–F, read-only)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Code</Label>
                <p>{report.incident.code}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p>{report.incident.subject}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <p>{format(new Date(report.incident.incidentDate), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Area</Label>
                <p>{report.incident.area?.name ?? '—'}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Description</Label>
                <p className="whitespace-pre-line">{report.incident.description ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investigation-specific sections summary */}
        <Card>
          <CardHeader>
            <CardTitle>A1 / A2 — Task & Equipment</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Task Performed</Label>
              <p className="whitespace-pre-line">{report.taskBeingPerformed ?? '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Equipment / Materials</Label>
              <p className="whitespace-pre-line">{report.equipmentUsed ?? '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>G — Cost Estimation</CardTitle>
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
            <CardTitle>H/I — Causes (HFACS)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {report.causes.length === 0 ? (
              <p className="text-muted-foreground">No causes selected.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {report.causes
                  .filter((c) => c.isSelected)
                  .map((c) => (
                    <li key={c.id}>
                      <span className="font-medium">[{c.causeKey}]</span> {c.causeName}
                      {c.customNotes && (
                        <span className="text-muted-foreground"> — {c.customNotes}</span>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>J — Action Plans</CardTitle>
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
                  {report.actionPlans.map((a, i) => (
                    <tr key={a.id} className="border-t">
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
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>K — Signatories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.signatories.map((s) => (
                <div key={s.id} className="rounded-md border p-3">
                  <p className="font-medium">{s.signatoryRole.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{s.roleName ?? '—'}</p>
                  <p className="text-sm mt-1">{s.name ?? '—'}</p>
                  {s.signedAt && (
                    <p className="text-xs text-muted-foreground">
                      Signed: {format(new Date(s.signedAt), 'dd MMM yyyy')}
                    </p>
                  )}
                  {s.signatureUrl && (
                    <img
                      src={s.signatureUrl}
                      className="h-12 mt-1 bg-white rounded border max-w-[200px] object-contain"
                      alt="signature"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>L — H&S Comments & Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label className="text-muted-foreground">Comments</Label>
              <p className="whitespace-pre-line">{report.hsComments ?? '—'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={report.distributionSafetyCommittee ? 'default' : 'outline'}>
                Safety Committee
              </Badge>
              <Badge variant={report.distributionHeadOfBusinessOp ? 'default' : 'outline'}>
                Head of Business Op.
              </Badge>
              <Badge variant={report.distributionRelatedDepartment ? 'default' : 'outline'}>
                Related Department
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Off-screen PDF target */}
      <div style={{ position: 'absolute', left: -10000, top: 0 }}>
        <div ref={targetRef as any}>
          <InvestigationReportPDFTemplate report={report} />
        </div>
      </div>
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

export default InvestigationReportDetailPage;
