import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/core/components/ui/table';
import type { ApprovalStatusHistory } from '@/modules/master-data';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';
import { EnvironmentalMeasurement } from '../types/environmental-measurement.types';
import type { EnvironmentalMeasurementRegulatoryLimits, MetricRegulatoryLimit } from '../services/environmentalMeasurementService';
import type { RegulatoryMetricKey } from '../utils/regulatoryLimitComparison';
import { formatRegulatoryComparisonText, getRegulatoryLimitMode } from '../utils/regulatoryLimitComparison';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';

interface EnvironmentalMeasurementPDFTemplateProps {
  measurement: EnvironmentalMeasurement;
  regulatoryLimits?: EnvironmentalMeasurementRegulatoryLimits | null;
  approvalHistory?: ApprovalStatusHistory | null;
}

function MetricPdfCell({
  metric,
  value,
  limitEntry,
}: {
  metric: RegulatoryMetricKey;
  value: number | undefined | null;
  limitEntry?: MetricRegulatoryLimit | null;
}) {
  const limit = limitEntry?.limit ?? null;
  const mode = limitEntry?.mode ?? getRegulatoryLimitMode(metric);
  const limitText = limit != null && Number.isFinite(limit) ? String(limit) : '—';
  const comparisonText = formatRegulatoryComparisonText(value, limit, mode);

  return (
    <div>
      <div className="font-medium">{value ?? '—'}</div>
      <div className="text-xs text-muted-foreground mt-1">Applicable Quality Standard Value: {limitText}</div>
      {comparisonText && (
        <div className="text-xs mt-1 font-medium">
          {comparisonText}
        </div>
      )}
    </div>
  );
}

function getStatusTextClass(status?: string) {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'APPROVED' || normalized === 'COMPLETED') return 'text-green-700';
  if (normalized === 'REJECTED') return 'text-red-700';
  if (normalized.includes('WAIT') || normalized.includes('AWAITING')) return 'text-blue-700';
  if (normalized === 'PENDING') return 'text-gray-700';
  return 'text-yellow-700';
}

/** Matches detail page badge wording for PDF consistency */
function getEntityStatusDisplayLabel(status?: string): string {
  switch (status) {
    case GeneralStatusEnum.DRAFT:
      return 'Draft';
    case GeneralStatusEnum.OPEN:
      return 'Open';
    case GeneralStatusEnum.WAITING_APPROVAL:
      return 'Waiting Approval';
    case GeneralStatusEnum.DONE:
      return 'Done';
    case GeneralStatusEnum.REJECTED:
      return 'Rejected';
    default: {
      const opt = GENERAL_STATUS_OPTIONS.find((o) => o.value === status);
      return opt?.label ?? status ?? '—';
    }
  }
}

/** Display step as 1-based for formal documents (backend lines are 0-based). */
function workflowStepDisplay(line: number): number {
  return line + 1;
}

function formatWorkflowStatusLabel(
  entityStatus: string | undefined,
  lineStatus: 'completed' | 'current' | 'pending',
  lastApprovalStatus: string | undefined,
): string {
  const es = entityStatus as GeneralStatusEnum | undefined;

  if (lineStatus === 'completed') {
    return lastApprovalStatus || 'Completed';
  }

  if (lineStatus === 'pending') {
    return 'Pending';
  }

  // current — interpret using entity lifecycle (API may mark first step "current" before approval is requested)
  if (es === GeneralStatusEnum.DRAFT || es === GeneralStatusEnum.OPEN) {
    return 'Pending';
  }

  if (es === GeneralStatusEnum.REJECTED) {
    if (lastApprovalStatus === 'REJECTED') {
      return 'Rejected';
    }
    return 'Pending';
  }

  if (es === GeneralStatusEnum.WAITING_APPROVAL) {
    return 'Awaiting verification';
  }

  if (es === GeneralStatusEnum.DONE) {
    return lastApprovalStatus || 'Completed';
  }

  return 'Pending';
}

export function EnvironmentalMeasurementPDFTemplate({
  measurement,
  regulatoryLimits,
  approvalHistory,
}: EnvironmentalMeasurementPDFTemplateProps) {
  const roomLabel = measurement.room
    ? `${measurement.room.name} (${measurement.room.code})`
    : '-';

  const allApprovals =
    approvalHistory?.history
      ?.slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) ?? [];
  const approvalLines = approvalHistory?.allApprovalLines ?? [];
  const entityStatusLabel = getEntityStatusDisplayLabel(measurement.status);
  const showNextApprover =
    measurement.status === GeneralStatusEnum.WAITING_APPROVAL && approvalHistory?.nextApprover;

  const createdByDisplay = measurement.creator
    ? `${measurement.creator.firstName} ${measurement.creator.lastName}`.trim()
    : '—';

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Non Water Monitoring Record</h1>
            <p className="text-sm text-gray-600 mb-1">
              Workplace environmental monitoring &middot; {format(new Date(measurement.date), 'dd MMMM yyyy')}
            </p>
            <p className="text-sm text-gray-600">Generated on {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
          </div>
          <div className="shrink-0">
            <PdfAppHeader />
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-2">
          Record information
        </h2>
        <Table data-pdf-table-splittable>
          <TableBody>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Date of measurement</TableHead>
              <TableCell>{format(new Date(measurement.date), 'dd MMMM yyyy')}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Room / location</TableHead>
              <TableCell>{roomLabel}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Date and time of record creation</TableHead>
              <TableCell>{format(new Date(measurement.createdAt), 'dd MMMM yyyy, HH:mm')}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Record prepared by</TableHead>
              <TableCell>{createdByDisplay}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-2">
          Measurement results
        </h2>
        <Table data-pdf-table-splittable>
          <TableBody>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Lighting (lux)</TableHead>
              <TableCell>
                <MetricPdfCell metric="lighting" value={measurement.lighting} limitEntry={regulatoryLimits?.lighting} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Noise (dB)</TableHead>
              <TableCell>
                <MetricPdfCell metric="noise" value={measurement.noise} limitEntry={regulatoryLimits?.noise} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Humidity (%)</TableHead>
              <TableCell>
                <MetricPdfCell metric="humidity" value={measurement.humidity} limitEntry={regulatoryLimits?.humidity} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Temperature (°C)</TableHead>
              <TableCell>
                <MetricPdfCell metric="temperature" value={measurement.temperature} limitEntry={regulatoryLimits?.temperature} />
              </TableCell>
            </TableRow>
            {measurement.remarks && (
              <TableRow>
                <TableHead className="w-[38%] bg-muted/50 font-semibold">Remarks</TableHead>
                <TableCell className="whitespace-pre-wrap">{measurement.remarks}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-2 mb-4">
          Verification and approval
        </h2>
        <div className="mb-4 text-sm text-gray-800 leading-relaxed">
          <span className="font-semibold">Current approval status: </span>
          <span>{entityStatusLabel}</span>
          {showNextApprover && (
            <>
              <span className="mx-2 text-gray-400">·</span>
              <span className="font-semibold">Next responsible party: </span>
              <span>
                {approvalHistory!.nextApprover!.department.name} — {approvalHistory!.nextApprover!.jobPosition.name}
                {' '}(Step {workflowStepDisplay(approvalHistory!.nextApprover!.line)})
              </span>
            </>
          )}
        </div>

        {approvalLines.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-2">Approval workflow (by step)</p>
            <table data-pdf-table-splittable className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Step no.</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Organizational unit</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Position</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Action by</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Date and time</th>
                </tr>
              </thead>
              <tbody>
                {approvalLines.map((line) => {
                  const approvalsForLine = allApprovals.filter((a) => a.line === line.line);
                  const lastApproval = approvalsForLine.length > 0 ? approvalsForLine[approvalsForLine.length - 1] : null;
                  const statusLabel = formatWorkflowStatusLabel(
                    measurement.status,
                    line.status,
                    lastApproval?.status,
                  );

                  return (
                    <tr key={`wf-${line.line}`}>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{workflowStepDisplay(line.line)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">{line.department.name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">{line.jobPosition.name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-xs">
                        <span className={`font-semibold ${getStatusTextClass(statusLabel)}`}>{statusLabel}</span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">{lastApproval?.creator?.name ?? '—'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                        {lastApproval?.createdAt ? format(new Date(lastApproval.createdAt), 'dd MMMM yyyy, HH:mm') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {allApprovals.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Chronological approval log</p>
            <table data-pdf-table-splittable className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No.</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Action by</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Organizational unit</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Position</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Date and time</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {allApprovals.map((approval, idx) => (
                  <tr key={`ah-${approval.id}`}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{idx + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">
                      <span className={`font-semibold ${getStatusTextClass(approval.status)}`}>{approval.status}</span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">{approval.creator?.name ?? '—'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">{approval.department?.name ?? '—'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">{approval.jobPosition?.name ?? '—'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                      {approval.createdAt ? format(new Date(approval.createdAt), 'dd MMMM yyyy, HH:mm') : '—'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words whitespace-pre-wrap">
                      {approval.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : approvalLines.length === 0 ? (
          <p className="text-sm text-gray-700">No approval workflow is associated with this record.</p>
        ) : null}
      </section>
    </div>
  );
}
