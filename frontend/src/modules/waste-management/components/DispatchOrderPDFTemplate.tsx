import { format } from 'date-fns';
import { Separator } from '@/core/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/core/components/ui/table';
import type { ApprovalStatusHistory } from '@/modules/master-data';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';
import { DispatchOrder } from '../types/waste-management.types';

const APPROVAL_FIELD_MARKERS = {
  FROM_ENTITY_DEPARTMENT: '@ENTITY_DEPARTMENT',
  FROM_ENTITY_JOB_POSITION: '@ENTITY_JOB_POSITION',
} as const;

function getApprovalLineLabel(value: string, fallback: string): string {
  if (value === APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT) return 'Dynamic: From Entity Data';
  if (value === APPROVAL_FIELD_MARKERS.FROM_ENTITY_JOB_POSITION) return 'Dynamic: From Entity Data (Department Head)';
  return fallback;
}

interface DispatchOrderPDFTemplateProps {
  dispatchOrder: DispatchOrder;
  /** Digital approval data from master-approvals */
  approvalHistory?: ApprovalStatusHistory | null;
}

function formatEntityStatus(status: GeneralStatusEnum | string): string {
  return String(status)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Matches detail page badge wording */
function getEntityStatusDisplayLabel(status?: string): string {
  switch (status) {
    case GeneralStatusEnum.DRAFT:
      return 'Draft';
    case GeneralStatusEnum.SCHEDULED:
      return 'Scheduled';
    case GeneralStatusEnum.OPEN:
      return 'Open';
    case GeneralStatusEnum.WAITING_APPROVAL:
      return 'Waiting Approval';
    case GeneralStatusEnum.DONE:
      return 'Done';
    case GeneralStatusEnum.REJECTED:
      return 'Rejected';
    case GeneralStatusEnum.CLOSE:
      return 'Close';
    default: {
      const opt = GENERAL_STATUS_OPTIONS.find((o) => o.value === status);
      return opt?.label ?? (status ? formatEntityStatus(status) : '—');
    }
  }
}

function formatApprovalActionLabel(status: string | undefined): string {
  if (!status) return 'Completed';
  return formatEntityStatus(status);
}

function workflowStepDisplay(line: number): number {
  return line + 1;
}

function formatWorkflowStatusLabel(
  entityStatus: string | undefined,
  lineStatus: 'completed' | 'current' | 'pending',
  lastApprovalStatus: string | undefined,
): string {
  const es = entityStatus as GeneralStatusEnum | undefined;
  const lastUpper = lastApprovalStatus ? String(lastApprovalStatus).toUpperCase() : '';

  if (lineStatus === 'completed') {
    if (lastUpper === 'REJECTED') return 'Rejected';
    return formatApprovalActionLabel(lastApprovalStatus);
  }

  if (lineStatus === 'pending') {
    if (es === GeneralStatusEnum.DONE || es === GeneralStatusEnum.SCHEDULED) {
      return 'Not applicable';
    }
    return 'Pending';
  }

  // current — interpret using entity lifecycle (API may leave steps current/pending after terminal states)
  if (es === GeneralStatusEnum.DRAFT || es === GeneralStatusEnum.OPEN) {
    return 'Pending';
  }

  if (es === GeneralStatusEnum.REJECTED) {
    if (lastUpper === 'REJECTED') {
      return 'Rejected';
    }
    return 'Pending';
  }

  if (es === GeneralStatusEnum.WAITING_APPROVAL) {
    return 'Awaiting verification';
  }

  if (es === GeneralStatusEnum.DONE || es === GeneralStatusEnum.SCHEDULED) {
    return lastApprovalStatus ? formatApprovalActionLabel(lastApprovalStatus) : 'Completed';
  }

  return 'Pending';
}

function shouldShowNoWorkflowMessage(
  orderStatus: GeneralStatusEnum | string,
  linesLen: number,
  historyLen: number,
): boolean {
  if (linesLen > 0 || historyLen > 0) return false;
  if (orderStatus === GeneralStatusEnum.DONE || orderStatus === GeneralStatusEnum.REJECTED) {
    return false;
  }
  return true;
}

export function DispatchOrderPDFTemplate({ dispatchOrder, approvalHistory }: DispatchOrderPDFTemplateProps) {
  const allApprovals =
    approvalHistory?.history
      ?.slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) ?? [];
  const approvalLines = approvalHistory?.allApprovalLines ?? [];
  const approvalStatusDisplay = formatEntityStatus(
    approvalHistory?.currentStatus ?? dispatchOrder.status,
  );
  const showNextApprover =
    dispatchOrder.status === GeneralStatusEnum.WAITING_APPROVAL && approvalHistory?.nextApprover;

  const attachmentLabels =
    dispatchOrder.attachments
      ?.slice()
      .sort((a, b) => a.order - b.order)
      .map((att) => att.fileName ?? att.fileUrl.split('/').pop() ?? 'File')
      .join(', ') || null;

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dispatch Order: {dispatchOrder.dispatchCode}
            </h1>
            <p className="text-sm text-gray-600 mb-1">Waste Dispatch Order</p>
            <p className="text-sm text-gray-600">Generated on {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
          </div>
          <div className="shrink-0">
            <PdfAppHeader />
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-2">
          Document information
        </h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Document number</TableHead>
              <TableCell className="font-mono">{dispatchOrder.dispatchCode}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Dispatch date</TableHead>
              <TableCell>{format(new Date(dispatchOrder.dispatchDate), 'dd MMMM yyyy, HH:mm')}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Quantity (kg)</TableHead>
              <TableCell className="font-semibold">
                {Number(dispatchOrder.quantity).toLocaleString('id-ID')} kg
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Status</TableHead>
              <TableCell>{getEntityStatusDisplayLabel(dispatchOrder.status)}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Approval status</TableHead>
              <TableCell>{approvalStatusDisplay}</TableCell>
            </TableRow>
            {dispatchOrder.memo && (
              <TableRow>
                <TableHead className="w-[38%] bg-muted/50 font-semibold align-top">Memo</TableHead>
                <TableCell className="whitespace-pre-wrap break-words">{dispatchOrder.memo}</TableCell>
              </TableRow>
            )}
            {attachmentLabels && (
              <TableRow>
                <TableHead className="w-[38%] bg-muted/50 font-semibold align-top">Attachments</TableHead>
                <TableCell className="break-words text-sm">{attachmentLabels}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-2">
          Record information
        </h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Ordered by</TableHead>
              <TableCell>
                {dispatchOrder.orderer
                  ? `${dispatchOrder.orderer.firstName} ${dispatchOrder.orderer.lastName}`
                  : '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Created by</TableHead>
              <TableCell>
                {dispatchOrder.creator
                  ? `${dispatchOrder.creator.firstName} ${dispatchOrder.creator.lastName}`
                  : '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Created at</TableHead>
              <TableCell>{format(new Date(dispatchOrder.createdAt), 'dd MMMM yyyy, HH:mm')}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="w-[38%] bg-muted/50 font-semibold">Last updated</TableHead>
              <TableCell>{format(new Date(dispatchOrder.updatedAt), 'dd MMMM yyyy, HH:mm')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-2 mb-4">
          Verification and approval
        </h2>
        <div className="mb-4 text-sm text-gray-800 leading-relaxed">
          <span className="font-semibold">Current approval status: </span>
          <span>{approvalStatusDisplay}</span>
          {showNextApprover && (
            <>
              <span className="mx-2 text-gray-400">·</span>
              <span className="font-semibold">Next responsible party: </span>
              <span>
                {approvalHistory!.nextApprover!.department.name} — {approvalHistory!.nextApprover!.jobPosition.name}{' '}
                (Step {workflowStepDisplay(approvalHistory!.nextApprover!.line)})
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
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Step no.
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Organizational unit
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Position
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Action by
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Date and time
                  </th>
                </tr>
              </thead>
              <tbody>
                {approvalLines.map((line) => {
                  const approvalsForLine = allApprovals.filter((a) => a.line === line.line);
                  const lastApproval =
                    approvalsForLine.length > 0 ? approvalsForLine[approvalsForLine.length - 1] : null;
                  const statusLabel = formatWorkflowStatusLabel(
                    dispatchOrder.status,
                    line.status,
                    lastApproval?.status,
                  );

                  return (
                    <tr key={`wf-${line.line}`}>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                        {workflowStepDisplay(line.line)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                        {getApprovalLineLabel(line.department.id, line.department.name)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                        {getApprovalLineLabel(line.jobPosition.id, line.jobPosition.name)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 font-semibold">
                        {statusLabel}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                        {lastApproval?.creator?.name ?? '—'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                        {lastApproval?.createdAt
                          ? format(new Date(lastApproval.createdAt), 'dd MMMM yyyy, HH:mm')
                          : '—'}
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
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    No.
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Action by
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Organizational unit
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Position
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Date and time
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {allApprovals.map((approval, idx) => (
                  <tr key={`ah-${approval.id}`}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{idx + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 font-semibold">
                      {formatApprovalActionLabel(approval.status)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                      {approval.creator?.name ?? '—'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                      {approval.department?.name ?? '—'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                      {approval.jobPosition?.name ?? '—'}
                    </td>
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
        ) : shouldShowNoWorkflowMessage(dispatchOrder.status, approvalLines.length, allApprovals.length) ? (
          <p className="text-sm text-gray-700">No approval workflow is associated with this record.</p>
        ) : null}
      </section>

      <Separator className="my-6" />

      <footer className="pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
        <p>Printed on: {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
        <p className="mt-1">Page 1 of 1</p>
      </footer>
    </div>
  );
}
