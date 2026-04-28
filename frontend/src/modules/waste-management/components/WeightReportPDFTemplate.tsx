import { format } from 'date-fns';
import { Separator } from '@/core/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/core/components/ui/table';
import type { ApprovalStatusHistory } from '@/modules/master-data';
import { WeightReport, WeightReportStatusEnum } from '../types/waste-management.types';

interface WeightReportPDFTemplateProps {
    report: WeightReport;
    /** Digital approval data from master-approvals (same shape as environmental measurements PDF) */
    approvalHistory?: ApprovalStatusHistory | null;
}

function submitterDisplayName(report: WeightReport): string {
    if (report.submitter) {
        return `${report.submitter.firstName} ${report.submitter.lastName}`.trim();
    }
    return '—';
}

function formatEntityStatus(status: WeightReportStatusEnum | string): string {
    return String(status)
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function workflowStepDisplay(line: number): number {
    return line + 1;
}

function formatWorkflowStatusLabel(
    lineStatus: 'completed' | 'current' | 'pending',
    lastApprovalStatus: string | undefined,
): string {
    if (String(lastApprovalStatus).toUpperCase() === 'REJECTED') {
        return 'Rejected';
    }
    if (lineStatus === 'completed') {
        return lastApprovalStatus || 'Completed';
    }
    if (lineStatus === 'current') {
        return 'Awaiting verification';
    }
    return 'Pending';
}

/** Show "no workflow" only for pre-approval states; DONE/REJECTED with no loaded lines/history stays visually empty. */
function shouldShowNoWorkflowMessage(
    reportStatus: WeightReportStatusEnum | string,
    linesLen: number,
    historyLen: number,
): boolean {
    if (linesLen > 0 || historyLen > 0) return false;
    if (
        reportStatus === WeightReportStatusEnum.DONE ||
        reportStatus === WeightReportStatusEnum.REJECTED
    ) {
        return false;
    }
    return true;
}

export function WeightReportPDFTemplate({ report, approvalHistory }: WeightReportPDFTemplateProps) {
    const allApprovals =
        approvalHistory?.history
            ?.slice()
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) ?? [];
    const approvalLines = approvalHistory?.allApprovalLines ?? [];
    const isDone = report.status === WeightReportStatusEnum.DONE;
    const isInApprovalFlow =
        report.status === WeightReportStatusEnum.WAITING_APPROVAL ||
        report.status === WeightReportStatusEnum.DONE ||
        report.status === WeightReportStatusEnum.REJECTED;
    const currentApprovalStatusLabel = isInApprovalFlow
        ? (approvalHistory?.currentStatus ?? formatEntityStatus(report.status))
        : formatEntityStatus(report.status);

    return (
        <div
            className="bg-white p-8 space-y-8 text-gray-900"
            style={{ fontFamily: 'Arial, sans-serif' }}
        >
            <header className="text-center border-b-2 border-gray-900 pb-4">
                <h1 className="text-xl font-bold uppercase tracking-tight mb-1">
                    Laporan Timbangan Limbah Padat
                </h1>
                <p className="text-sm text-gray-600">SOLID WASTE WEIGHT REPORT</p>
            </header>

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-2">
                    Document information
                </h2>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableHead className="w-[38%] bg-muted/50 font-semibold">Report number</TableHead>
                            <TableCell>{report.reportCode}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-[38%] bg-muted/50 font-semibold">Waste source</TableHead>
                            <TableCell className="break-words">{report.source?.name || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-[38%] bg-muted/50 font-semibold">Storage location</TableHead>
                            <TableCell className="break-words">{report.storageLocation?.name || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-[38%] bg-muted/50 font-semibold">Report date</TableHead>
                            <TableCell>
                                {report.reportDate ? format(new Date(report.reportDate), 'dd MMMM yyyy') : '-'}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-[38%] bg-muted/50 font-semibold">Status</TableHead>
                            <TableCell className="text-gray-900">{formatEntityStatus(report.status)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-2">
                    Waste items
                </h2>
                <Table>
                    <TableBody>
                        <TableRow className="bg-gray-100">
                            <TableHead className="font-semibold text-xs">Type</TableHead>
                            <TableHead className="font-semibold text-xs text-right">Weight</TableHead>
                            <TableHead className="font-semibold text-xs">Unit</TableHead>
                            <TableHead className="font-semibold text-xs">Notes</TableHead>
                        </TableRow>
                        {report.items && report.items.length > 0 ? (
                            report.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-xs break-words">{item.wasteType?.name || '-'}</TableCell>
                                    <TableCell className="text-xs text-right">
                                        {item.weight.toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-xs">{item.unit}</TableCell>
                                    <TableCell className="text-xs break-words whitespace-pre-wrap">
                                        {item.notes || '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                                    No line items
                                </TableCell>
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
                            <TableHead className="w-[38%] bg-muted/50 font-semibold">Date and time of record creation</TableHead>
                            <TableCell>
                                {report.createdAt
                                    ? format(new Date(report.createdAt), 'dd MMMM yyyy, HH:mm')
                                    : '—'}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-[38%] bg-muted/50 font-semibold">Submitted by</TableHead>
                            <TableCell>{submitterDisplayName(report)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="w-[38%] bg-muted/50 font-semibold">Submission date and time</TableHead>
                            <TableCell>{format(new Date(report.submittedAt), 'dd MMMM yyyy, HH:mm')}</TableCell>
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
                    <span>{currentApprovalStatusLabel || '—'}</span>
                    {!isDone && isInApprovalFlow && approvalHistory?.nextApprover && (
                        <>
                            <span className="mx-2 text-gray-400">·</span>
                            <span className="font-semibold">Next responsible party: </span>
                            <span>
                                {approvalHistory.nextApprover.department.name} —{' '}
                                {approvalHistory.nextApprover.jobPosition.name} (Step{' '}
                                {workflowStepDisplay(approvalHistory.nextApprover.line)})
                            </span>
                        </>
                    )}
                </div>

                {isInApprovalFlow && approvalLines.length > 0 && (
                    <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-900 mb-2">Approval workflow (by step)</p>
                        <table
                            data-pdf-table-splittable
                            className="min-w-full border border-gray-300"
                            style={{ borderCollapse: 'collapse' }}
                        >
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
                                        approvalsForLine.length > 0
                                            ? approvalsForLine[approvalsForLine.length - 1]
                                            : null;
                                    const statusLabel = formatWorkflowStatusLabel(line.status, lastApproval?.status);

                                    return (
                                        <tr key={`wf-${line.line}`}>
                                            <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                                                {workflowStepDisplay(line.line)}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                                                {line.department.name}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                                                {line.jobPosition.name}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 font-semibold">
                                                {statusLabel}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                                                {lastApproval?.creator?.name ?? '—'}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words">
                                                {lastApproval?.createdAt
                                                    ? format(
                                                          new Date(lastApproval.createdAt),
                                                          'dd MMMM yyyy, HH:mm',
                                                      )
                                                    : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {isInApprovalFlow && allApprovals.length > 0 ? (
                    <div>
                        <p className="text-sm font-semibold text-gray-900 mb-2">Chronological approval log</p>
                        <table
                            data-pdf-table-splittable
                            className="min-w-full border border-gray-300"
                            style={{ borderCollapse: 'collapse' }}
                        >
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
                                        <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                                            {idx + 1}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 font-semibold">
                                            {approval.status}
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
                                            {approval.createdAt
                                                ? format(new Date(approval.createdAt), 'dd MMMM yyyy, HH:mm')
                                                : '—'}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 break-words whitespace-pre-wrap">
                                            {approval.notes || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : !isInApprovalFlow ? (
                    <p className="text-sm text-gray-700">Approval has not been requested yet.</p>
                ) : shouldShowNoWorkflowMessage(
                      report.status,
                      approvalLines.length,
                      allApprovals.length,
                  ) ? (
                    <p className="text-sm text-gray-700">
                        No approval workflow is associated with this record.
                    </p>
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
