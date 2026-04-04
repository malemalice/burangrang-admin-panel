import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { PPEWithdrawal } from '../types/ppe.types';
import { ApprovalStatusHistory } from '@/modules/master-data';

interface PPEWithdrawalPDFTemplateProps {
  withdrawal: PPEWithdrawal;
  approvalHistory: ApprovalStatusHistory | null;
  viewUrl: string;
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

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Document Header */}
      <div
        className="mb-6 pb-4"
        style={{ borderBottom: '2px solid #111' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p
              className="text-xs font-semibold text-gray-500 mb-1 tracking-widest uppercase"
            >
              Health, Safety &amp; Environment
            </p>
            <h1
              className="font-bold text-gray-900"
              style={{ fontSize: '22px', letterSpacing: '0.5px' }}
            >
              PPE WITHDRAWAL REQUEST
            </h1>
            <p className="text-sm text-gray-700 mt-1 font-medium">
              {na(withdrawal.withdrawalCode)}
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>
              Generated:{' '}
              {format(new Date(), 'dd MMM yyyy HH:mm')}
            </p>
            <p className="mt-1">
              Status:{' '}
              <span className="font-semibold text-gray-900">
                {statusLabel[withdrawal.status] ?? withdrawal.status}
              </span>
            </p>
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

      {/* Approval Status */}
      <div className="mb-6">
        <h2
          className="font-bold text-gray-900 mb-3 pb-1"
          style={{ fontSize: '14px', borderBottom: '1px solid #ccc' }}
        >
          Approval Status
        </h2>

        <div className="mb-3" style={{ fontSize: '12px', color: '#333' }}>
          <span style={{ fontWeight: 600 }}>Current Status: </span>
          <span>{approvalHistory?.currentStatus || (statusLabel[withdrawal.status] ?? withdrawal.status)}</span>
          {approvalHistory?.nextApprover && (
            <>
              <span style={{ margin: '0 8px', color: '#999' }}>|</span>
              <span style={{ fontWeight: 600 }}>Next Approver: </span>
              <span>
                {approvalHistory.nextApprover.department.name} /{' '}
                {approvalHistory.nextApprover.jobPosition.name}
              </span>
            </>
          )}
        </div>

        {approvalLines.length > 0 && (
          <div className="mb-4">
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#333', marginBottom: '6px' }}>
              Workflow
            </p>
            <table
              className="min-w-full"
              style={{ borderCollapse: 'collapse', border: '1px solid #ccc' }}
            >
              <thead>
                <tr style={{ background: '#e8e8e8' }}>
                  {['Step', 'Department', 'Position', 'Status', 'By', 'Date'].map((h) => (
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

                  const lineStatus =
                    line.status === 'completed'
                      ? lastApproval?.status || 'COMPLETED'
                      : line.status === 'current'
                        ? 'WAITING VERIFICATION'
                        : 'PENDING';

                  return (
                    <tr key={`wf-${line.line}`}>
                      <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111' }}>
                        {line.line}
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
                              'dd MMM yyyy HH:mm',
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

        {allApprovals.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#333', marginBottom: '6px' }}>
              Approval History
            </p>
            <table
              className="min-w-full"
              style={{ borderCollapse: 'collapse', border: '1px solid #ccc' }}
            >
              <thead>
                <tr style={{ background: '#e8e8e8' }}>
                  {['No.', 'Status', 'Line', 'By', 'Department', 'Position', 'Date', 'Notes'].map((h) => (
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
                    <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: '11px', color: '#111' }}>
                      {approval.line}
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
                            'dd MMM yyyy HH:mm',
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
        )}

        {allApprovals.length === 0 && approvalLines.length === 0 && (
          <p style={{ fontSize: '11px', color: '#666' }}>
            No approval information available.
          </p>
        )}
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
