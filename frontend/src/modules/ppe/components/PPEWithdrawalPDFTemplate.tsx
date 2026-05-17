import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { PPEWithdrawal, PPEWithdrawalStatus } from '../types/ppe.types';
import { ApprovalStatusHistory } from '@/modules/master-data';
import PdfAppHeader from '@/core/components/pdf/PdfAppHeader';

interface PPEWithdrawalPDFTemplateProps {
  withdrawal: PPEWithdrawal;
  approvalHistory: ApprovalStatusHistory | null;
  viewUrl: string;
}

/** 1-based step for formal PDFs; API `line` is 0-based (see TRD §712–715). */
function workflowStepDisplay(line: number): number {
  return line + 1;
}

function formatWorkflowStatusLabel(
  lineStatus: 'completed' | 'current' | 'pending',
  lastApprovalStatus: string | undefined,
): string {
  if (lineStatus === 'completed') {
    return lastApprovalStatus || 'Completed';
  }
  if (lineStatus === 'current') {
    return 'Awaiting verification';
  }
  return 'Pending';
}

export function PPEWithdrawalPDFTemplate({
  withdrawal,
  approvalHistory,
  viewUrl,
}: PPEWithdrawalPDFTemplateProps) {
  const na = (v: unknown) =>
    v != null && v !== '' ? String(v) : '—';

  const allApprovals =
    approvalHistory?.history
      ?.slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ) || [];

  const approvalLines = approvalHistory?.allApprovalLines || [];

  const statusLabel: Record<string, string> = {
    PENDING: 'Pending',
    WAITING_APPROVAL: 'Waiting Approval',
    APPROVED: 'Approved',
    COLLECTED: 'Collected',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected',
  };

  const isTerminalWithdrawal =
    withdrawal.status === PPEWithdrawalStatus.COLLECTED ||
    withdrawal.status === PPEWithdrawalStatus.CANCELLED ||
    withdrawal.status === PPEWithdrawalStatus.REJECTED;

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Document Header */}
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PPE Withdrawal Request: {na(withdrawal.withdrawalCode)}
            </h1>
            <p className="text-sm text-gray-600 mb-1">
              Status: {statusLabel[withdrawal.status] ?? withdrawal.status}
            </p>
            <p className="text-sm text-gray-600">Generated on {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
          </div>
          <div className="shrink-0">
            <PdfAppHeader />
          </div>
        </div>
      </div>

      {/* Document Information */}
      <div className="mb-6">
        <h2
          className="font-bold text-gray-900 mb-3 pb-1"
          style={{ fontSize: '14px', borderBottom: '1px solid #ccc' }}
        >
          Withdrawal Information
        </h2>
        <table
          data-pdf-table-splittable
          className="min-w-full"
          style={{ borderCollapse: 'collapse', border: '1px solid #ccc' }}
        >
          <tbody>
            {[
              ['Withdrawal Code', na(withdrawal.withdrawalCode)],
              [
                'Withdrawal Date',
                withdrawal.withdrawalDate
                  ? format(
                      new Date(withdrawal.withdrawalDate),
                      'dd MMMM yyyy',
                    )
                  : '—',
              ],
              [
                'Status',
                statusLabel[withdrawal.status] ?? withdrawal.status,
              ],
              [
                'Requested By',
                na(
                  withdrawal.createdByName || withdrawal.createdBy,
                ),
              ],
              ['Requested For', na(withdrawal.requestedForName)],
              ['Department', na(withdrawal.departmentName || withdrawal.departmentId)],
              ...(withdrawal.jobPositionName
                ? [['Job Position', na(withdrawal.jobPositionName)]]
                : []),
              ...(withdrawal.collectedDate
                ? [
                    [
                      'Collected Date',
                      format(
                        new Date(withdrawal.collectedDate),
                        'dd MMMM yyyy HH:mm',
                      ),
                    ],
                  ]
                : []),
              ...(withdrawal.collectedBy
                ? [['Collected By', na(withdrawal.collectedBy)]]
                : []),
              [
                'Created At',
                format(
                  new Date(withdrawal.createdAt),
                  'dd MMMM yyyy HH:mm',
                ),
              ],
              [
                'Last Updated',
                format(
                  new Date(withdrawal.updatedAt),
                  'dd MMMM yyyy HH:mm',
                ),
              ],
              ...(withdrawal.notes
                ? [['Notes', na(withdrawal.notes)]]
                : []),
            ].map(([label, value], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#555',
                    width: '30%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '6px 10px',
                    fontSize: '11px',
                    color: '#111',
                    whiteSpace: label === 'Notes' ? 'pre-wrap' : undefined,
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Withdrawal Items */}
      <div className="mb-6">
        <h2
          className="font-bold text-gray-900 mb-3 pb-1"
          style={{ fontSize: '14px', borderBottom: '1px solid #ccc' }}
        >
          Withdrawal Items
        </h2>
        {withdrawal.items && withdrawal.items.length > 0 ? (
          <table
            data-pdf-table-splittable
            className="min-w-full"
            style={{ borderCollapse: 'collapse', border: '1px solid #ccc' }}
          >
            <thead>
              <tr style={{ background: '#e8e8e8' }}>
                {[
                  { label: 'No.', width: '4%' },
                  { label: 'Equipment Name', width: '26%' },
                  { label: 'Type', width: '18%' },
                  { label: 'Size', width: '14%' },
                  { label: 'Requested Qty', width: '13%' },
                  { label: 'Approved Qty', width: '12%' },
                  { label: 'Issued Qty', width: '13%' },
                ].map((col) => (
                  <th
                    key={col.label}
                    style={{
                      border: '1px solid #ccc',
                      padding: '6px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textAlign: 'left',
                      color: '#333',
                      width: col.width,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withdrawal.items.map((item, idx) => (
                <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111' }}>
                    {idx + 1}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', wordBreak: 'break-word' }}>
                    {item.stockItemEquipmentName || item.stockItemId || '—'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111' }}>
                    {item.stockItemEquipmentType || '—'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111' }}>
                    {item.stockItemEquipmentSize || '—'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', textAlign: 'center' }}>
                    {item.requestedQuantity}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', textAlign: 'center' }}>
                    {item.approvedQuantity ?? '—'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', textAlign: 'center' }}>
                    {item.issuedQuantity ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '11px', color: '#666' }}>No items found.</p>
        )}
      </div>

      {/* Verification and approval — TRD §696–719 (digital Master Approval) */}
      <div className="mb-6">
        <h2
          className="font-bold text-gray-900 mb-3 pb-1 uppercase tracking-wide"
          style={{ fontSize: '13px', borderBottom: '1px solid #ccc' }}
        >
          Verification and approval
        </h2>

        <div className="mb-4" style={{ fontSize: '12px', color: '#333', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600 }}>Current approval status: </span>
          <span>
            {approvalHistory?.currentStatus ??
              statusLabel[withdrawal.status] ??
              withdrawal.status}
          </span>
          {!isTerminalWithdrawal && approvalHistory?.nextApprover && (
            <>
              <span style={{ margin: '0 8px', color: '#999' }}>·</span>
              <span style={{ fontWeight: 600 }}>Next responsible party: </span>
              <span>
                {approvalHistory.nextApprover.department.name} —{' '}
                {approvalHistory.nextApprover.jobPosition.name}{' '}
                (Step {workflowStepDisplay(approvalHistory.nextApprover.line)})
              </span>
            </>
          )}
        </div>

        {approvalLines.length > 0 && (
          <div className="mb-4">
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#333', marginBottom: '6px' }}>
              Approval workflow (by step)
            </p>
            <table
              data-pdf-table-splittable
              className="min-w-full"
              style={{ borderCollapse: 'collapse', border: '1px solid #ccc' }}
            >
              <thead>
                <tr style={{ background: '#e8e8e8' }}>
                  {[
                    'Step no.',
                    'Organizational unit',
                    'Position',
                    'Status',
                    'Action by',
                    'Date and time',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        border: '1px solid #ccc',
                        padding: '5px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textAlign: 'left',
                        color: '#333',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvalLines.map((line) => {
                  const approvalsForLine = allApprovals.filter(
                    (a) => a.line === line.line,
                  );
                  const lastApproval =
                    approvalsForLine.length > 0
                      ? approvalsForLine[approvalsForLine.length - 1]
                      : null;

                  const lineStatus = formatWorkflowStatusLabel(
                    line.status,
                    lastApproval?.status,
                  );

                  return (
                    <tr key={`wf-${line.line}`}>
                      <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111' }}>
                        {workflowStepDisplay(line.line)}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', wordBreak: 'break-word' }}>
                        {line.department.name}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', wordBreak: 'break-word' }}>
                        {line.jobPosition.name}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', fontWeight: 600, color: '#111' }}>
                        {lineStatus}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', wordBreak: 'break-word' }}>
                        {lastApproval?.creator?.name || '—'}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', whiteSpace: 'nowrap' }}>
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

        {allApprovals.length > 0 ? (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#333', marginBottom: '6px' }}>
              Chronological approval log
            </p>
            <table
              data-pdf-table-splittable
              className="min-w-full"
              style={{ borderCollapse: 'collapse', border: '1px solid #ccc' }}
            >
              <thead>
                <tr style={{ background: '#e8e8e8' }}>
                  {[
                    'No.',
                    'Status',
                    'Action by',
                    'Organizational unit',
                    'Position',
                    'Date and time',
                    'Remarks',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        border: '1px solid #ccc',
                        padding: '5px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textAlign: 'left',
                        color: '#333',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allApprovals.map((approval, idx) => (
                  <tr key={`ah-${approval.id}`} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111' }}>
                      {idx + 1}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', fontWeight: 600, color: '#111' }}>
                      {approval.status}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', wordBreak: 'break-word' }}>
                      {approval.creator?.name || '—'}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', wordBreak: 'break-word' }}>
                      {approval.department?.name || '—'}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', wordBreak: 'break-word' }}>
                      {approval.jobPosition?.name || '—'}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', whiteSpace: 'nowrap' }}>
                      {approval.createdAt
                        ? format(
                            new Date(approval.createdAt),
                            'dd MMMM yyyy, HH:mm',
                          )
                        : '—'}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {approval.notes || '—'}
                      {approval.isHistorical ? ' (Historical)' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : approvalLines.length === 0 ? (
          <p style={{ fontSize: '11px', color: '#666' }}>
            No approval workflow is associated with this record.
          </p>
        ) : null}
      </div>

      {/* QR Code Footer */}
      <div
        className="pt-4 mt-6 flex items-end justify-between"
        style={{ borderTop: '1px solid #ccc' }}
      >
        <p style={{ fontSize: '10px', color: '#888' }}>
          This document is system-generated. Scan the QR code to verify online.
        </p>
        <div className="flex flex-col items-end gap-1">
          <QRCodeSVG
            value={viewUrl}
            size={88}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
          />
          <p
            style={{
              fontSize: '8px',
              color: '#666',
              maxWidth: '180px',
              textAlign: 'right',
              wordBreak: 'break-all',
            }}
          >
            {viewUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
